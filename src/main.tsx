import { render } from "preact";
import App from "./App";
import { invoke } from "@tauri-apps/api/core";

invoke("init");
console.debug("FFmpeg binary downloaded.");
render(<App />, document.getElementById("root")!);