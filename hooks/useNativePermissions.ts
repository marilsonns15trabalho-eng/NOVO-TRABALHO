'use client';

import { useEffect, useState } from 'react';
import { useNativeApp } from '@/hooks/useNativeApp';
import {
  checkNativePermissions,
  requestCameraAccess,
  requestNotificationAccess,
  requestStorageAccess,
  sendNotificationPreview,
  type NativePermissionSnapshot,
} from '@/lib/native-app';

const DEFAULT_PERMISSIONS: NativePermissionSnapshot = {
  camera: 'unavailable',
  notifications: 'unavailable',
  storage: 'unavailable',
};

export function useNativePermissions() {
  const nativeApp = useNativeApp();
  const [permissions, setPermissions] = useState<NativePermissionSnapshot>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<'camera' | 'notifications' | 'storage' | 'test' | null>(null);

  const refreshPermissions = async () => {
    if (!nativeApp) {
      setPermissions(DEFAULT_PERMISSIONS);
      return DEFAULT_PERMISSIONS;
    }

    setLoading(true);
    try {
      const snapshot = await checkNativePermissions();
      setPermissions(snapshot);
      return snapshot;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshPermissions();
  }, [nativeApp]);

  const requestCameraPermission = async () => {
    setBusyKey('camera');
    try {
      const status = await requestCameraAccess();
      setPermissions((current) => ({ ...current, camera: status }));
      return status;
    } finally {
      setBusyKey(null);
    }
  };

  const requestNotificationPermission = async () => {
    setBusyKey('notifications');
    try {
      const status = await requestNotificationAccess();
      setPermissions((current) => ({ ...current, notifications: status }));
      return status;
    } finally {
      setBusyKey(null);
    }
  };

  const requestStoragePermission = async () => {
    setBusyKey('storage');
    try {
      const status = await requestStorageAccess();
      setPermissions((current) => ({ ...current, storage: status }));
      return status;
    } finally {
      setBusyKey(null);
    }
  };

  const sendTestNotification = async () => {
    setBusyKey('test');
    try {
      await sendNotificationPreview();
    } finally {
      setBusyKey(null);
    }
  };

  return {
    nativeApp,
    permissions,
    loading,
    busyKey,
    allGranted:
      nativeApp &&
      permissions.camera === 'granted' &&
      permissions.notifications === 'granted' &&
      permissions.storage === 'granted',
    refreshPermissions,
    requestCameraPermission,
    requestNotificationPermission,
    requestStoragePermission,
    sendTestNotification,
  };
}
