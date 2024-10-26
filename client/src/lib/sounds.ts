export enum SoundCategory {
	SFX = 'sfx',
	MUSIC = 'music',
}

const volumes: Record<SoundCategory, number> = {
	[SoundCategory.SFX]: .5,
	[SoundCategory.MUSIC]: .25,
}

function loadSound(soundName: string, category: SoundCategory) {
  const audio = new Audio();
  audio.src = `/sounds/${soundName}.mp3`;

  const updateVolume = () => {
	audio.volume = volumes[category];
  }

  const play = async () => {
	audio.currentTime = 0;
	updateVolume();
	await audio.play();
  }

  const stop = () => {
	audio.pause();
	}

  return {
	play,
	stop,
	updateVolume,
	category,
  }
}

const sounds = {
	join: loadSound('join', SoundCategory.SFX),
	leave: loadSound('leave', SoundCategory.SFX),
	gameover: loadSound('gameover', SoundCategory.SFX),
	pick: loadSound('pick', SoundCategory.SFX),
	point: loadSound('point', SoundCategory.SFX),
	selected: loadSound('selected', SoundCategory.SFX),
}

export function setVolume(category: SoundCategory, volume: number) {
	volumes[category] = volume;

	Object.values(sounds).forEach(sound => {
		if (sound.category === category) {
			sound.updateVolume();
		}
	});
}

export function getVolume(category: SoundCategory) {
	return volumes[category];
}

export function playSound(sound: keyof typeof sounds) {
	return sounds[sound].play();
}
