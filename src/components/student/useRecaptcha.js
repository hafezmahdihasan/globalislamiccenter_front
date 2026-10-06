"use client";

import { useCallback, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/**
 * Lazy reCAPTCHA v3 loader. The Google script is only fetched when the
 * visitor first interacts with the form, keeping the initial page light.
 */
export default function useRecaptcha() {
  const loadingRef = useRef(null);

  const load = useCallback(() => {
    if (!SITE_KEY) return Promise.reject(new Error("reCAPTCHA site key is not configured"));
    if (typeof window !== "undefined" && window.grecaptcha?.ready) return Promise.resolve();
    if (loadingRef.current) return loadingRef.current;

    loadingRef.current = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loadingRef.current = null;
        reject(new Error("Failed to load reCAPTCHA"));
      };
      document.head.appendChild(script);
    });
    return loadingRef.current;
  }, []);

  const preload = useCallback(() => {
    load().catch(() => {
      // Surfaced later, when a token is actually requested.
    });
  }, [load]);

  const getToken = useCallback(
    async (action) => {
      await load();
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(SITE_KEY, { action }).then(resolve, reject);
        });
      });
    },
    [load],
  );

  return { preload, getToken, isConfigured: Boolean(SITE_KEY) };
}
