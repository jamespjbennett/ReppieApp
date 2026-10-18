import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { DATABASE_NAME, initWorkoutDatabase } from '@/db/workout-logs';
import { WorkoutJournalProvider } from '@/features/workout/journal';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initWorkoutDatabase}>
        <WorkoutJournalProvider>
          <AppTabs />
        </WorkoutJournalProvider>
      </SQLiteProvider>
    </ThemeProvider>
  );
}
