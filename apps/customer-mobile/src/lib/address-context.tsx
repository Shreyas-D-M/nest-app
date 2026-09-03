import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { Address } from '@nest/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listAddresses } from './api';
import { useAuth } from './auth-context';

const SELECTED_ADDRESS_KEY = 'nest.customer.selected_address_id';
const memoryStore = new Map<string, string>();

let cachedStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
} | null = null;

async function getStorage(): Promise<{
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}> {
  if (cachedStorage) {
    return cachedStorage;
  }

  try {
    const expoSecureStore = await import('expo-secure-store');
    const storeModule = (expoSecureStore as unknown as { default?: typeof expoSecureStore }).default ?? expoSecureStore;
    const getItemAsync = storeModule.getItemAsync as ((key: string) => Promise<string | null>) | undefined;
    const setItemAsync = storeModule.setItemAsync as ((key: string, value: string) => Promise<void>) | undefined;
    const deleteItemAsync = storeModule.deleteItemAsync as ((key: string) => Promise<void>) | undefined;

    if (typeof getItemAsync === 'function' && typeof setItemAsync === 'function' && typeof deleteItemAsync === 'function') {
      cachedStorage = {
        getItem: (key: string) => getItemAsync(key),
        setItem: (key: string, value: string) => setItemAsync(key, value),
        removeItem: (key: string) => deleteItemAsync(key),
      };
      return cachedStorage;
    }
  } catch {
    // falls back to memory storage
  }

  cachedStorage = {
    getItem: async (key: string) => memoryStore.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memoryStore.set(key, value);
    },
    removeItem: async (key: string) => {
      memoryStore.delete(key);
    },
  };
  return cachedStorage;
}

export interface AddressContextValue {
  addresses: Address[];
  selectedAddress: Address | null;
  selectedAddressId: string | null;
  isLoading: boolean;
  isError: boolean;
  selectAddress: (id: string | null) => Promise<void>;
  refetchAddresses: () => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | null>(null);

export function AddressProvider({ children }: { children: ReactNode }): ReactElement {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!session) {
      setSelectedAddressId(null);
      setIsStorageLoaded(true);
      return;
    }

    void getStorage().then(async (storage) => {
      const storedId = await storage.getItem(SELECTED_ADDRESS_KEY);
      if (isMounted) {
        setSelectedAddressId(storedId);
        setIsStorageLoaded(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [session]);

  const {
    data: addressesData,
    isLoading: isAddressesLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: listAddresses,
    enabled: Boolean(session),
  });

  const addresses = useMemo(() => addressesData ?? [], [addressesData]);

  // Compute selected address:
  // 1. If stored selectedAddressId matches an existing address, use it.
  // 2. Otherwise default to addresses[0] (primary saved address) or null if none saved.
  const selectedAddress = useMemo<Address | null>(() => {
    if (!addresses || addresses.length === 0) return null;
    if (selectedAddressId) {
      const match = addresses.find((a) => a.id === selectedAddressId);
      if (match) return match;
    }
    return addresses[0] ?? null;
  }, [addresses, selectedAddressId]);

  // Persist address selection
  const selectAddress = useCallback(
    async (id: string | null): Promise<void> => {
      setSelectedAddressId(id);
      const storage = await getStorage();
      if (id) {
        await storage.setItem(SELECTED_ADDRESS_KEY, id).catch(() => undefined);
      } else {
        await storage.removeItem(SELECTED_ADDRESS_KEY).catch(() => undefined);
      }
    },
    [],
  );

  const refetchAddresses = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['addresses'] });
    await refetch();
  }, [queryClient, refetch]);

  const value = useMemo<AddressContextValue>(
    () => ({
      addresses,
      selectedAddress,
      selectedAddressId: selectedAddress?.id ?? selectedAddressId,
      isLoading: !isStorageLoaded || (Boolean(session) && isAddressesLoading),
      isError,
      selectAddress,
      refetchAddresses,
    }),
    [
      addresses,
      selectedAddress,
      selectedAddressId,
      isStorageLoaded,
      session,
      isAddressesLoading,
      isError,
      selectAddress,
      refetchAddresses,
    ],
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddress(): AddressContextValue {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider.');
  }
  return context;
}
