/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ChatInterface from "./components/ChatInterface";

export default function App() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Atmosphere */}
      <div className="atmosphere" />
      
      {/* Subtle Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Main Content */}
      <div className="relative z-10">
        <ChatInterface />
      </div>
    </main>
  );
}
