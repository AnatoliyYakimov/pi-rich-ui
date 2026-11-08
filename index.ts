import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import * as tui from '@earendil-works/pi-tui';
import { setup } from './lib/extension.mjs';

export default async function (pi: ExtensionAPI) {
  await setup(pi, tui);
}
