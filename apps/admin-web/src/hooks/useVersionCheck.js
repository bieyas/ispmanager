import { useEffect, useState } from 'react';

export function useVersionCheck(apiBaseUrl, onUpdateAvailable) {
    const [currentVersion, setCurrentVersion] = useState(null);
    const [checkInterval, setCheckInterval] = useState(5 * 60 * 1000); // 5 menit

    useEffect(() => {
        // Set initial version dari window atau fallback ke 0.1.0
        const initialVersion = window.__APP_VERSION__ || '0.1.0';
        setCurrentVersion(initialVersion);

        // Fungsi untuk check version dari server
        const checkVersion = async () => {
            try {
                if (!apiBaseUrl) return;

                const response = await fetch(`${apiBaseUrl}/api/version`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) return;

                const data = await response.json();
                const latestVersion = data.version;

                if (latestVersion && latestVersion !== currentVersion) {
                    console.log(`New version available: ${latestVersion} (current: ${currentVersion})`);

                    if (onUpdateAvailable) {
                        onUpdateAvailable(latestVersion);
                    } else {
                        // Auto-reload jika tidak ada callback custom
                        const userConfirmed = window.confirm(
                            `Update tersedia: ${latestVersion}\n\nReload aplikasi sekarang untuk mendapatkan fitur terbaru?`
                        );
                        if (userConfirmed) {
                            window.location.reload();
                        }
                    }
                }
            } catch (error) {
                console.warn('Version check failed:', error);
            }
        };

        // Check version immediately
        checkVersion();

        // Setup interval untuk periodic check
        const intervalId = setInterval(checkVersion, checkInterval);

        return () => clearInterval(intervalId);
    }, [apiBaseUrl, checkInterval, currentVersion, onUpdateAvailable]);

    return { currentVersion };
}
