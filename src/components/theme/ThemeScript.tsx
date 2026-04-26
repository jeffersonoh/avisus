const STORAGE_KEY = "avisus-theme";

/** Evita flash de tema antes do React hidratar (lê localStorage e preferência do sistema). */
export function ThemeScript() {
  const code = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var t=localStorage.getItem(k);if(t==="dark"||t==="light"){document.documentElement.classList.toggle("dark",t==="dark");return;}if(window.matchMedia("(prefers-color-scheme: dark)").matches){document.documentElement.classList.add("dark");}}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
