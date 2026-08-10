import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { ModalSheet } from './ModalSheet';
import { AdminButton } from './AdminUI';
import { colors, radius, spacing } from '@/constants/theme';

interface PromptModalProps {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
  confirmLabel?: string;
}

export function PromptModal({ visible, title, message, placeholder, onCancel, onConfirm, confirmLabel = 'Confirmar' }: PromptModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue('');
  }, [visible]);

  return (
    <ModalSheet
      visible={visible}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <AdminButton label="Cancelar" onPress={onCancel} variant="outline" fullWidth />
          <AdminButton label={confirmLabel} onPress={() => onConfirm(value)} variant="primary" fullWidth />
        </>
      }
    >
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
        autoFocus
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  message: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
});
