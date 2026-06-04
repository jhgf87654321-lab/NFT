export type StudioTheme = 'mdrs' | 'axon';

/** 与形象生成器一致：单栏最大视口高度，内部滚动、底栏固定 */
export const AXON_STUDIO_VIEWPORT_HEIGHT = 'h-[85vh] max-h-[85vh] min-h-[420px]';

export const axonStudioColumnClass =
  'lg:col-span-4 flex w-full min-h-0 flex-col overflow-hidden ' + AXON_STUDIO_VIEWPORT_HEIGHT;

export function isAxonTheme(theme: StudioTheme): boolean {
  return theme === 'axon';
}

/** 主按钮：MDRS 黑 / AXON 紫 */
export function studioPrimaryBtn(active: boolean, theme: StudioTheme): string {
  if (theme === 'axon') {
    return active
      ? 'bg-primary text-white hover:bg-primary/90 shadow-[0_8px_24px_rgba(95,61,148,0.25)]'
      : 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]';
  }
  return active
    ? 'bg-black/5 text-black/20 cursor-not-allowed'
    : 'bg-black text-white hover:bg-black/90 active:scale-[0.98] shadow-2xl';
}

export function studioChipSelected(theme: StudioTheme): string {
  return theme === 'axon'
    ? 'bg-primary border-primary text-white shadow-lg'
    : 'bg-black border-black text-white shadow-xl';
}

export function studioChipIdle(theme: StudioTheme): string {
  return theme === 'axon'
    ? 'bg-transparent border-neutral-300 text-black/45 hover:border-primary/40 hover:text-primary'
    : 'bg-transparent border-black/5 text-black/40 hover:border-black/20';
}

export function studioIconBtnActive(theme: StudioTheme): string {
  return theme === 'axon' ? 'bg-primary text-white border-primary' : 'bg-black text-white border-black';
}

export function studioRangeAccent(theme: StudioTheme): string {
  return theme === 'axon' ? 'accent-primary' : 'accent-black';
}
