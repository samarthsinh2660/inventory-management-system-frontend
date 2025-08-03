import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import productsSlice from './slices/productsSlice';
import inventorySlice from './slices/inventorySlice';
import alertsSlice from './slices/alertsSlice';
import auditLogsSlice from './slices/auditLogsSlice';
import subcategoriesSlice from './slices/subcategoriesSlice';
import locationsSlice from './slices/locationsSlice';
import usersSlice from './slices/usersSlice';
import formulasSlice from './slices/formulasSlice';
import purchaseInfoSlice from './slices/purchaseInfoSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Only persist auth state
};

const rootReducer = combineReducers({
  auth: authSlice,
  products: productsSlice,
  inventory: inventorySlice,
  alerts: alertsSlice,
  auditLogs: auditLogsSlice,
  subcategories: subcategoriesSlice,
  locations: locationsSlice,
  users: usersSlice,
  formulas: formulasSlice,
  purchaseInfo: purchaseInfoSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;