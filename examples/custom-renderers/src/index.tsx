import { StrictMode } from "react";
import { render } from "react-dom";

import App from "./App";
import "./index.css";

render(
    <StrictMode>
        <header>
            <h1>React Photo Album | Custom Renderers</h1>
            <a href="https://github.com/igordanchenko/react-photo-album" target="_blank" rel="noreferrer noopener">
                GitHub
            </a>
            <a href="https://react-photo-album.com/" target="_blank" rel="noreferrer noopener">
                Docs
            </a>
        </header>
        <main>
            <App />
        </main>
    </StrictMode>,
    document.getElementById("root")
);
