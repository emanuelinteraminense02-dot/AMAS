window.AMAS_CONFIG = Object.assign(
    {
        apiBase: (typeof window !== "undefined" && window.location && window.location.protocol !== "file:")
            ? "/api"
            : "https://amas-m58z.onrender.com/api"
    },
    window.AMAS_CONFIG || {}
);
