 import { useEffect, useState } from "react";
 
 type Theme = "light" | "dark";
 
 export function useTheme() {
   const [theme, setTheme] = useState<Theme>(() => {
     const saved = localStorage.getItem("agendilha-theme");
     if (saved === "light" || saved === "dark") return saved;
     
     return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
   });
 
   useEffect(() => {
     const root = window.document.documentElement;
     root.classList.remove("light", "dark");
     root.classList.add(theme);
     root.style.colorScheme = theme;
     localStorage.setItem("agendilha-theme", theme);
   }, [theme]);
 
   // Sync with system preference if user hasn't explicitly set a preference
   useEffect(() => {
     const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
     const handleChange = () => {
       if (!localStorage.getItem("agendilha-theme")) {
         setTheme(mediaQuery.matches ? "dark" : "light");
       }
     };
     
     mediaQuery.addEventListener("change", handleChange);
     return () => mediaQuery.removeEventListener("change", handleChange);
   }, []);
 
   const toggleTheme = () => {
     setTheme((prev) => (prev === "light" ? "dark" : "light"));
   };
 
   return { theme, setTheme, toggleTheme };
 }