-- Creates the database used by integration tests.
--
-- Kept separate from nest_dev so that a test run which truncates tables can
-- never destroy local development data.
CREATE DATABASE nest_test OWNER nest;
