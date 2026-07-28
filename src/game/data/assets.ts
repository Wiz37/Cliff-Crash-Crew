export const AUDIO_URLS = {
  music: new URL('../../../audio/music_loop.wav', import.meta.url).href,
  engine: new URL('../../../audio/engine_loop.wav', import.meta.url).href,
  launch: new URL('../../../audio/launch.wav', import.meta.url).href,
  impact1: new URL('../../../audio/impact_1.wav', import.meta.url).href,
  impact2: new URL('../../../audio/impact_2.wav', import.meta.url).href,
  impact3: new URL('../../../audio/impact_3.wav', import.meta.url).href,
  break: new URL('../../../audio/break.wav', import.meta.url).href,
  star: new URL('../../../audio/star.wav', import.meta.url).href,
  click: new URL('../../../audio/ui_click.wav', import.meta.url).href,
} as const;
