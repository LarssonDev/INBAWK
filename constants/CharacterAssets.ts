const CharacterAssets: any = {
    char1: {
        neutral: require('../assets/images/characters/char1_neutral.png'),
        happy: require('../assets/images/characters/char1_happy.png'),
        sad: require('../assets/images/characters/char1_sad.png'),
        angry: require('../assets/images/characters/char1_angry.png'),
    },
    char2: {
        neutral: require('../assets/images/characters/char2_neutral.png'),
        happy: require('../assets/images/characters/char2_happy.png'),
        sad: require('../assets/images/characters/char2_sad.png'),
        angry: require('../assets/images/characters/char2_angry.png'),
    },
    char3: {
        neutral: require('../assets/images/characters/char3_neutral.png'),
        happy: require('../assets/images/characters/char3_happy.png'),
        sad: require('../assets/images/characters/char3_sad.png'),
        angry: require('../assets/images/characters/char3_angry.png'),
    },
    char4: {
        neutral: require('../assets/images/characters/char4_neutral.png'),
        happy: require('../assets/images/characters/char4_happy.png'),
        sad: require('../assets/images/characters/char4_sad.png'),
        angry: require('../assets/images/characters/char4_angry.png'),
    },
    char5: {
        neutral: require('../assets/images/characters/char5_neutral.png'),
        happy: require('../assets/images/characters/char5_happy.png'),
        sad: require('../assets/images/characters/char5_sad.png'),
        angry: require('../assets/images/characters/char5_angry.png'),
    },
};

export const getRandomCharacter = (id: number) => {
    const keys = Object.keys(CharacterAssets);
    const index = id % keys.length;
    return keys[index];
};

export default CharacterAssets;
