import { Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';
import { useAuth } from '@/lib/auth-context';

type MenuGroup = {
  title: string;
  items: Array<{ label: string; route?: string; description?: string }>;
};

const menuGroups: MenuGroup[] = [
  {
    title: 'Account',
    items: [
      { label: 'Profile', route: '/profile' },
      { label: 'Saved Professionals', route: '/favorites' },
      { label: 'Addresses', route: '/addresses' },
    ],
  },
  {
    title: 'Activity',
    items: [
      { label: 'Bookings', route: '/bookings' },
      { label: 'Notifications', route: '/notifications' },
      { label: 'Messages', route: '/messages' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help & Support', route: '/support' },
      { label: 'Settings', route: '/settings' },
      { label: 'About', route: '/about' },
    ],
  },
  {
    title: 'Session',
    items: [{ label: 'Sign Out' }],
  },
];

export default function MenuScreen(): ReactElement {
  const theme = useTheme();
  const { signOut } = useAuth();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.replace('/sign-in');
    Alert.alert('Signed out', 'You have been signed out.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <View style={styles.topRow}>
          <Text variant="caption" color="secondary">Menu</Text>
          <Link href="/" asChild>
            <Text variant="secondary" color="accent">Close</Text>
          </Link>
        </View>

        <Text variant="h1">More</Text>

        {menuGroups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text variant="h2" style={{ marginBottom: 10 }}>{group.title}</Text>
            {group.items.map((item) => (
              <Pressable
                key={`${group.title}-${item.label}`}
                onPress={() => {
                  if (item.route) {
                    router.push(item.route);
                    return;
                  }

                  void handleSignOut();
                }}
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <Text variant="bodyStrong">{item.label}</Text>
                {item.description ? (
                  <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                    {item.description}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  group: { gap: 8 },
  menuItem: { borderWidth: 1, padding: 14 },
});
