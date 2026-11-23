import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** Dev dùng .next-dev, build/start dùng .next để `npm run build` không làm hỏng dev server đang chạy. */
export default (phase) => ({
  reactStrictMode: true,
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
