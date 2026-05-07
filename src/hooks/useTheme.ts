 import { useEffect, useState } from "react";
 
  export function useTheme() {
    useEffect(() => {
      const root = window.document.documentElement;
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    }, []);

    return { 
      theme: "light", 
      setTheme: () => {}, 
      toggleTheme: () => {} 
    };
  }