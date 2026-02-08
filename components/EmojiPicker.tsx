import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';

const EMOJIS = [
    '😀', '😂', '😍', '🤔', '😎', '😭', '😡', '👍', '👎', '👏', '🎉', '🔥', '💩', '👻', '🤖'
];

interface EmojiPickerProps {
    visible: boolean;
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ visible, onSelect, onClose }) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container}>
                    <Text style={styles.title}>Send Reaction</Text>
                    <FlatList
                        data={EMOJIS}
                        numColumns={5}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.emojiButton}
                                onPress={() => onSelect(item)}
                            >
                                <Text style={styles.emojiText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: 300,
        backgroundColor: '#2c3e50',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#34495e'
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    listContent: {
        alignItems: 'center',
    },
    emojiButton: {
        padding: 10,
    },
    emojiText: {
        fontSize: 30,
    }
});

export default EmojiPicker;
