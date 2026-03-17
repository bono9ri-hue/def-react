document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Theme Management
    const themeToggle = document.getElementById('theme-toggle');
    let isDark = localStorage.getItem('theme') === 'dark' || 
                 (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
                 
    const applyTheme = (dark) => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    };
    
    applyTheme(isDark);
    
    themeToggle.addEventListener('click', () => {
        isDark = !isDark;
        applyTheme(isDark);
    });

    const getActiveTab = () => new Promise((resolve) => 
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => resolve(tabs[0]))
    );

    const getToken = () => new Promise(resolve => 
        chrome.runtime.sendMessage({ action: 'get-clerk-token' }, res => resolve(res ? res.token : null))
    );

    const WORKER_URL = "https://def-api.deference.workers.dev";

    // Actions
    document.getElementById('btn-capture-area').addEventListener('click', async () => {
        const tab = await getActiveTab();
        chrome.tabs.sendMessage(tab.id, { action: 'start-selection' });
        window.close();
    });

    document.getElementById('btn-capture-visible').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'capture-visible-tab' });
        window.close();
    });

    document.getElementById('btn-batch-archive').addEventListener('click', async () => {
        const tab = await getActiveTab();
        chrome.tabs.sendMessage(tab.id, { action: 'open-batch-save' });
        window.close();
    });

    // Save Bookmark
    document.getElementById('btn-save-bookmark').addEventListener('click', async () => {
        const tab = await getActiveTab();
        const token = await getToken();
        
        if (!token) {
            alert("Please log in on deference.work first!");
            window.open("https://deference.work");
            return;
        }

        const btn = document.getElementById('btn-save-bookmark');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span style="font-size:12px; font-weight:bold; color:var(--text-main);">Saving...</span>`;

        try {
            await fetch(`${WORKER_URL}/bookmarks`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    name: tab.title,
                    url: tab.url,
                    icon_type: "color",
                    icon_value: "transparent",
                    icon_scale: 1.0
                })
            });
            btn.innerHTML = `<span style="font-size:12px; font-weight:bold; color:var(--text-main);">Saved! 📌</span>`;
            setTimeout(() => window.close(), 1000);
        } catch (e) {
            btn.innerHTML = originalHtml;
            alert("Failed to save bookmark.");
        }
    });

    // Save Link
    document.getElementById('btn-save-link').addEventListener('click', async () => {
        const tab = await getActiveTab();
        const token = await getToken();
        
        if (!token) {
            alert("Please log in on deference.work first!");
            window.open("https://deference.work");
            return;
        }

        const btn = document.getElementById('btn-save-link');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = `<span style="font-size:12px; font-weight:bold; color:var(--text-main);">Saving...</span>`;

        try {
            await fetch(`${WORKER_URL}/assets`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({
                    image_url: "",
                    page_url: tab.url,
                    memo: tab.title,
                    tags: "Links",
                    folder: "",
                    item_type: "link"
                })
            });
            btn.innerHTML = `<span style="font-size:12px; font-weight:bold; color:var(--text-main);">Saved! 🔗</span>`;
            setTimeout(() => window.close(), 1000);
        } catch (e) {
            btn.innerHTML = originalHtml;
            alert("Failed to save link.");
        }
    });
});
