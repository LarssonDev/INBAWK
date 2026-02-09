const CharacterAssets: any = {
    char1: {
        neutral: require('../assets/images/characters/char1_neutral.png'),
        happy: require('../assets/images/characters/char1_neutral.png'),
        sad: require('../assets/images/characters/char1_neutral.png'),
        angry: require('../assets/images/characters/char1_neutral.png'),
    },
    char2: {
        neutral: require('../assets/images/characters/char2_neutral.png'),
        happy: require('../assets/images/characters/char2_neutral.png'),
        sad: require('../assets/images/characters/char2_neutral.png'),
        angry: require('../assets/images/characters/char2_neutral.png'),
    },
    char3: {
        neutral: require('../assets/images/characters/char3_neutral.png'),
        happy: require('../assets/images/characters/char3_neutral.png'),
        sad: require('../assets/images/characters/char3_neutral.png'),
        angry: require('../assets/images/characters/char3_neutral.png'),
    },
    char4: {
        neutral: require('../assets/images/characters/char4_neutral.png'),
        happy: require('../assets/images/characters/char4_neutral.png'),
        sad: require('../assets/images/characters/char4_neutral.png'),
        angry: require('../assets/images/characters/char4_neutral.png'),
    },
    char5: {
        neutral: require('../assets/images/characters/char5_neutral.png'),
        happy: require('../assets/images/characters/char5_neutral.png'),
        sad: require('../assets/images/characters/char5_neutral.png'),
        angry: require('../assets/images/characters/char5_neutral.png'),
    },
    char6: {
        neutral: require('../assets/images/characters/char6_neutral.png'),
        happy: require('../assets/images/characters/char6_neutral.png'),
        sad: require('../assets/images/characters/char6_neutral.png'),
        angry: require('../assets/images/characters/char6_neutral.png'),
    },
    char7: {
        neutral: require('../assets/images/characters/char7_neutral.png'),
        happy: require('../assets/images/characters/char7_neutral.png'),
        sad: require('../assets/images/characters/char7_neutral.png'),
        angry: require('../assets/images/characters/char7_neutral.png'),
    },
    char8: {
        neutral: require('../assets/images/characters/char8_neutral.png'),
        happy: require('../assets/images/characters/char8_neutral.png'),
        sad: require('../assets/images/characters/char8_neutral.png'),
        angry: require('../assets/images/characters/char8_neutral.png'),
    },
    char9: {
        neutral: require('../assets/images/characters/char9_neutral.png'),
        happy: require('../assets/images/characters/char9_neutral.png'),
        sad: require('../assets/images/characters/char9_neutral.png'),
        angry: require('../assets/images/characters/char9_neutral.png'),
    },
    char10: {
        neutral: require('../assets/images/characters/char10_neutral.png'),
        happy: require('../assets/images/characters/char10_neutral.png'),
        sad: require('../assets/images/characters/char10_neutral.png'),
        angry: require('../assets/images/characters/char10_neutral.png'),
    },
    char11: {
        neutral: require('../assets/images/characters/char11_neutral.png'),
        happy: require('../assets/images/characters/char11_neutral.png'),
        sad: require('../assets/images/characters/char11_neutral.png'),
        angry: require('../assets/images/characters/char11_neutral.png'),
    },
};

export const getRandomCharacter = (id: number) => {
    const keys = Object.keys(CharacterAssets);
    const index = id % keys.length;
    return keys[index];
};

export default CharacterAssets;
