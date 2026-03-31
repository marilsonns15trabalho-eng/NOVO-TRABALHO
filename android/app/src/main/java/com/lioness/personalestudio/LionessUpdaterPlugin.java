package com.lioness.personalestudio;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.text.TextUtils;

import androidx.annotation.Nullable;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LionessUpdater")
public class LionessUpdaterPlugin extends Plugin {
    private long activeDownloadId = -1L;
    private @Nullable BroadcastReceiver downloadReceiver;

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        String fileName = sanitizeFileName(call.getString("fileName", "LIONESSFIT-update.apk"));

        if (TextUtils.isEmpty(url)) {
            call.reject("URL do APK nao informada.");
            return;
        }

        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) {
            call.reject("DownloadManager indisponivel neste aparelho.");
            return;
        }

        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("Atualizacao do Lioness Fit");
            request.setDescription("Baixando a nova versao do app");
            request.setMimeType("application/vnd.android.package-archive");
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);

            registerDownloadReceiver();
            activeDownloadId = downloadManager.enqueue(request);

            JSObject response = new JSObject();
            response.put("started", true);
            response.put("downloadId", activeDownloadId);
            response.put("fileName", fileName);
            call.resolve(response);
        } catch (Exception exception) {
            call.reject("Nao foi possivel iniciar a atualizacao do app.", exception);
        }
    }

    private void registerDownloadReceiver() {
        if (downloadReceiver != null) {
            return;
        }

        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) {
                    return;
                }

                long completedDownloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (completedDownloadId != activeDownloadId) {
                    return;
                }

                openInstaller(context, completedDownloadId);
                activeDownloadId = -1L;
            }
        };

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(downloadReceiver, filter);
        }
    }

    private void openInstaller(Context context, long downloadId) {
        DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager == null) {
            return;
        }

        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        Cursor cursor = null;

        try {
            cursor = downloadManager.query(query);
            if (cursor == null || !cursor.moveToFirst()) {
                return;
            }

            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            if (statusIndex < 0) {
                return;
            }

            int status = cursor.getInt(statusIndex);
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                return;
            }

            Uri apkUri = downloadManager.getUriForDownloadedFile(downloadId);
            if (apkUri == null) {
                return;
            }

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            context.startActivity(installIntent);
        } catch (Exception ignored) {
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    private String sanitizeFileName(String rawFileName) {
        String normalized = rawFileName
            .replaceAll("[^a-zA-Z0-9._-]+", "-")
            .replaceAll("-{2,}", "-")
            .replaceAll("^-|-$", "");

        if (TextUtils.isEmpty(normalized)) {
            return "LIONESSFIT-update.apk";
        }

        return normalized.endsWith(".apk") ? normalized : normalized + ".apk";
    }

    @Override
    protected void handleOnDestroy() {
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {
            }
            downloadReceiver = null;
        }
    }
}
