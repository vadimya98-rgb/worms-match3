export const Effects = {
  play(scene, key, config = {}) {
    if (scene.cache.audio.exists(key)) {
      scene.sound.play(key, config);
    }
  },

  vibrate(ms) {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  },

  click(scene) {
    this.play(scene, 'sfx_click', { volume: 0.5 });
    this.vibrate(20);
  },

  swap(scene) {
    this.play(scene, 'sfx_swap', { volume: 0.4 });
    this.vibrate(10);
  },

  // Звук выстрела убран, оставлена только вибрация при запуске снаряда
  shoot(scene) {
    this.vibrate(20);
  },

  explode(scene) {
    this.play(scene, 'sfx_explode', { volume: 0.7 });
    this.vibrate(50);
  },

  buy(scene) {
    this.play(scene, 'sfx_buy', { volume: 0.6 });
    this.vibrate(40);
  },

  error(scene) {
    this.play(scene, 'sfx_error', { volume: 0.5 });
    this.vibrate([50, 50, 50]); 
  },

  heal(scene) {
    this.play(scene, 'sfx_heal', { volume: 0.6 });
    this.vibrate(30);
  },

  win(scene) {
    this.play(scene, 'sfx_win', { volume: 0.8 });
    this.vibrate([100, 50, 100, 50, 200]);
  },

  lose(scene) {
    this.play(scene, 'sfx_lose', { volume: 0.8 });
    this.vibrate([200, 100, 200]);
  }
};
