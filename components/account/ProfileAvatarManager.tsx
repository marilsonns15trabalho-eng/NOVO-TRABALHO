'use client';

import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNativeApp } from '@/hooks/useNativeApp';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import { buildProfileAvatarCachePath, optimizeProfileAvatarFile } from '@/lib/profile-avatar';
import { captureProfileAvatarFile } from '@/lib/native-app';
import { removeCachedNativeFile } from '@/lib/native-file-cache';
import {
  deleteMyProfileAvatar,
  uploadMyProfileAvatar,
} from '@/services/profile-avatar.service';

interface ProfileAvatarManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileAvatarManager({
  open,
  onClose,
}: ProfileAvatarManagerProps) {
  const { profile, user, patchProfile } = useAuth();
  const nativeApp = useNativeApp();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busyKey, setBusyKey] = useState<'camera' | 'upload' | 'remove' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  if (!open) {
    return null;
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Usuario';

  const updateProfileAvatarState = (payload: {
    avatar_path: string | null;
    avatar_updated_at: string | null;
  }) => {
    patchProfile({
      avatar_path: payload.avatar_path,
      avatar_updated_at: payload.avatar_updated_at,
    });
  };

  const removePreviousNativeCache = async () => {
    if (!nativeApp || !profile?.id || !profile.avatar_path) {
      return;
    }

    await removeCachedNativeFile(
      buildProfileAvatarCachePath(profile.id, profile.avatar_updated_at),
    );
  };

  const handleFileSelected = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setBusyKey('upload');
      setFeedback(null);
      const optimized = await optimizeProfileAvatarFile(file);
      const result = await uploadMyProfileAvatar(optimized);
      await removePreviousNativeCache();
      updateProfileAvatarState(result);
      setFeedback({ type: 'success', text: 'Foto de perfil atualizada com sucesso.' });
    } catch (error: any) {
      setFeedback({
        type: 'error',
        text: error?.message || 'Nao foi possivel atualizar a foto de perfil.',
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      setBusyKey('camera');
      setFeedback(null);
      const captured = await captureProfileAvatarFile();
      await handleFileSelected(captured);
    } catch (error: any) {
      setFeedback({
        type: 'error',
        text: error?.message || 'Nao foi possivel abrir a camera agora.',
      });
      setBusyKey(null);
    }
  };

  const handleRemove = async () => {
    try {
      setBusyKey('remove');
      setFeedback(null);
      const result = await deleteMyProfileAvatar();
      await removePreviousNativeCache();
      updateProfileAvatarState(result);
      setFeedback({ type: 'success', text: 'Foto de perfil removida.' });
    } catch (error: any) {
      setFeedback({
        type: 'error',
        text: error?.message || 'Nao foi possivel remover a foto de perfil.',
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] overflow-y-auto bg-black/92 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-3xl border border-zinc-800 bg-zinc-950/96 shadow-[0_36px_120px_-64px_rgba(0,0,0,0.95)]">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              Perfil
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Foto de perfil</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Sua foto fica em storage privado e o app usa cache local para abrir mais rapido no
              celular.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center border border-zinc-800 bg-zinc-900 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-6 md:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex flex-col items-center border border-zinc-800 bg-black/30 p-5">
              <ProfileAvatar
                displayName={displayName}
                className="h-36 w-36 rounded-[32px]"
                textClassName="text-4xl"
              />
              <p className="mt-4 text-center text-lg font-bold text-white">{displayName}</p>
              <p className="mt-1 text-center text-xs text-zinc-500">{user?.email}</p>
            </div>

            {feedback ? (
              <div
                className={`border px-4 py-3 text-sm leading-6 ${
                  feedback.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                }`}
              >
                {feedback.text}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="border border-zinc-800 bg-black/30 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                Atualizar foto
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                A foto e recortada em formato quadrado e otimizada antes do envio para manter o
                app leve e rapido.
              </p>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {nativeApp ? (
                  <button
                    type="button"
                    onClick={() => void handleCapturePhoto()}
                    disabled={busyKey !== null}
                    className="inline-flex items-center justify-center gap-2 border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyKey === 'camera' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    Tirar foto
                  </button>
                ) : null}

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] ?? null;
                    void handleFileSelected(selected);
                    event.currentTarget.value = '';
                  }}
                />

                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busyKey !== null}
                  className="inline-flex items-center justify-center gap-2 border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyKey === 'upload' ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  Enviar foto
                </button>
              </div>
            </div>

            <div className="border border-zinc-800 bg-black/30 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                Experiencia no app
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                O avatar fica salvo em cache privado no celular para reduzir recargas e deixar a
                interface mais fluida sem aumentar o peso do banco.
              </p>

              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={busyKey !== null || !profile?.avatar_path}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
                  profile?.avatar_path
                    ? 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300'
                    : 'cursor-not-allowed border border-zinc-900 bg-zinc-950 text-zinc-600'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {busyKey === 'remove' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Remover foto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
