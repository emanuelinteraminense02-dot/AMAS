import { ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/constants/theme';
import type { StatusAssociado, StatusContribuicao, StatusSolicitacao } from '@/types';

/* ─── Badge de status ─────────────────────────────────────────── */
type StatusKind = StatusAssociado | StatusContribuicao | StatusSolicitacao | string;

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Regular: { bg: '#dcfce7', fg: '#15803d' },
  Aprovado: { bg: '#dcfce7', fg: '#15803d' },
  Inadimplente: { bg: '#fee2e2', fg: '#b91c1c' },
  Recusado: { bg: '#fee2e2', fg: '#b91c1c' },
  'Em análise': { bg: '#fef3c7', fg: '#b45309' },
  'Revisão solicitada': { bg: '#ffedd5', fg: '#c2410c' },
  Pendente: { bg: '#e5e7eb', fg: '#4b5563' },
};

export function Badge({ status, small }: { status: StatusKind; small?: boolean }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE.Pendente;
  return (
    <View style={[badgeStyles.pill, { backgroundColor: style.bg }, small && badgeStyles.pillSmall]}>
      <Text style={[badgeStyles.text, { color: style.fg }, small && badgeStyles.textSmall]}>{status}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillSmall: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: 11.5, fontWeight: '700' },
  textSmall: { fontSize: 10 },
});

/* ─── Card genérico ──────────────────────────────────────────────── */
export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[cardStyles.card, style]}>{children}</View>;
}

export function CardTitleRow({ title, icon, action }: { title: string; icon?: keyof typeof Ionicons.glyphMap; action?: ReactNode }) {
  return (
    <View style={cardStyles.titleRow}>
      <View style={cardStyles.titleLeft}>
        {icon ? <Ionicons name={icon} size={16} color={colors.azulDeep} /> : null}
        <Text style={cardStyles.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, ...shadow.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, gap: spacing.sm },
  titleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  title: { fontSize: 14.5, fontWeight: '700', color: colors.textPrimary },
});

/* ─── Estado vazio / carregando ──────────────────────────────────── */
export function EmptyState({ text, icon = 'file-tray-outline' }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={miscStyles.emptyState}>
      <Ionicons name={icon} size={26} color={colors.textMuted} />
      <Text style={miscStyles.emptyText}>{text}</Text>
    </View>
  );
}

export function LoadingBlock({ text = 'Carregando...' }: { text?: string }) {
  return (
    <View style={miscStyles.emptyState}>
      <ActivityIndicator color={colors.azulDeep} />
      <Text style={miscStyles.emptyText}>{text}</Text>
    </View>
  );
}

const miscStyles = StyleSheet.create({
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});

/* ─── Botões ──────────────────────────────────────────────────────── */
type BtnVariant = 'primary' | 'outline' | 'danger' | 'success' | 'ghost';

interface AdminButtonProps {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLE: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.azulDeep, fg: colors.white },
  outline: { bg: 'transparent', fg: colors.azulDeep, border: colors.border },
  danger: { bg: '#fee2e2', fg: '#b91c1c' },
  success: { bg: '#dcfce7', fg: '#15803d' },
  ghost: { bg: 'transparent', fg: colors.textMuted },
};

export function AdminButton({
  label,
  onPress,
  variant = 'outline',
  icon,
  loading,
  disabled,
  small,
  fullWidth,
}: AdminButtonProps) {
  const v = VARIANT_STYLE[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        btnStyles.base,
        small && btnStyles.small,
        fullWidth && { flex: 1 },
        { backgroundColor: v.bg, borderColor: v.border || 'transparent', borderWidth: v.border ? 1 : 0 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 13 : 15} color={v.fg} /> : null}
          <Text style={[btnStyles.text, small && btnStyles.textSmall, { color: v.fg }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const btnStyles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  small: { paddingHorizontal: 10, paddingVertical: 7 },
  text: { fontWeight: '700', fontSize: 13 },
  textSmall: { fontSize: 11.5 },
});

/* ─── Campo de formulário ────────────────────────────────────────── */
interface FormFieldProps extends TextInputProps {
  label: string;
  required?: boolean;
}

export function FormField({ label, required, style, ...rest }: FormFieldProps) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {required ? ' *' : ''}
      </Text>
      <TextInput style={[fieldStyles.input, style]} placeholderTextColor={colors.textMuted} {...rest} />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
});

/* ─── Busca ───────────────────────────────────────────────────────── */
export function SearchInput({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder?: string }) {
  return (
    <View style={searchStyles.wrap}>
      <Ionicons name="search" size={15} color={colors.textMuted} />
      <TextInput
        style={searchStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Buscar...'}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const searchStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.bgCard,
  },
  input: { flex: 1, fontSize: 13.5, color: colors.textPrimary, padding: 0 },
});
