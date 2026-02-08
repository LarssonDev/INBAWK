import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';

const Notification = ({ msg }: any) => {
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (msg) {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.delay(1500),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                })
            ]).start();
        }
    }, [msg]);

    if (!msg) return null;

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <Text style={styles.text}>{msg}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '40%',
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        zIndex: 1000,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    text: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center'
    }
});

export default Notification;
