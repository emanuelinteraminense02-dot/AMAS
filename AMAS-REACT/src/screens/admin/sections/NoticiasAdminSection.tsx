import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { apiNoticias } from '@/services/api';
import { formatDataCurta } from '@/utils/format';
import { Card, CardTitleRow, AdminButton, EmptyState, LoadingBlock, FormField } from '@/components/admin/AdminUI';
import { ModalSheet } from '@/components/admin/ModalSheet';
import type { CategoriaNoticia, Noticia } from '@/types';

const CATEGORIAS: CategoriaNoticia[] = ['comunicado', 'parceria', 'social', 'conquista'];

const FORM_VAZIO = { titulo: '', resumo: '', conteudo: '', categoria: 'comunicado' as CategoriaNoticia, destaque: false };

export function NoticiasAdminSection() {
  const [lista, setLista] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setLista((await apiNoticias.listar()) as Noticia[]);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNova() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setModalAberto(true);
  }

  function abrirEdicao(n: Noticia) {
    setEditandoId(n.id);
    setForm({
      titulo: n.titulo,
      resumo: n.resumo || '',
      conteudo: n.conteudo || '',
      categoria: (n.categoria as CategoriaNoticia) || 'comunicado',
      destaque: !!n.destaque,
    });
    setModalAberto(true);
  }

  async function salvar() {
    if (!form.titulo.trim() || !form.resumo.trim() || !form.conteudo.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) await apiNoticias.atualizar(editandoId, form);
      else await apiNoticias.criar(form);
      setModalAberto(false);
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function excluir(n: Noticia) {
    Alert.alert('Excluir notícia', 'Deseja realmente excluir esta notícia?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiNoticias.remover(n.id);
            await carregar();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingBlock text="Carregando notícias..." />;

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <CardTitleRow title="Notícias" icon="newspaper-outline" action={<AdminButton label="Nova" icon="add" variant="primary" small onPress={abrirNova} />} />
      </Card>

      {lista.length === 0 ? (
        <Card>
          <EmptyState text="Nenhuma notícia cadastrada." icon="newspaper-outline" />
        </Card>
      ) : (
        lista.map((n) => (
          <Card key={n.id} style={{ gap: 6 }}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.titulo} numberOfLines={2}>{n.destaque ? '⭐ ' : ''}{n.titulo}</Text>
                <Text style={styles.meta}>{n.categoria} · {formatDataCurta(n.publicadaEm)} · {n.autor || 'AMAS'}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <AdminButton label="" icon="create-outline" small onPress={() => abrirEdicao(n)} />
                <AdminButton label="" icon="trash-outline" small variant="danger" onPress={() => excluir(n)} />
              </View>
            </View>
            <Text style={styles.resumo} numberOfLines={2}>{n.resumo}</Text>
          </Card>
        ))
      )}

      <ModalSheet
        visible={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editandoId ? 'Editar Notícia' : 'Nova Notícia'}
        footer={
          <>
            <AdminButton label="Cancelar" onPress={() => setModalAberto(false)} variant="outline" fullWidth />
            <AdminButton label="Salvar" onPress={salvar} variant="primary" fullWidth loading={salvando} />
          </>
        }
      >
        <FormField label="Título" required value={form.titulo} onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))} />
        <FormField label="Resumo" required value={form.resumo} onChangeText={(v) => setForm((f) => ({ ...f, resumo: v }))} />

        <Text style={styles.fieldLabel}>Categoria</Text>
        <View style={styles.chipsRow}>
          {CATEGORIAS.map((c) => (
            <TouchableOpacity key={c} onPress={() => setForm((f) => ({ ...f, categoria: c }))} style={[styles.chip, form.categoria === c && styles.chipActive]}>
              <Text style={[styles.chipText, form.categoria === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Conteúdo completo *</Text>
        <TextInput
          style={styles.textarea}
          value={form.conteudo}
          onChangeText={(v) => setForm((f) => ({ ...f, conteudo: v }))}
          multiline
          numberOfLines={5}
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setForm((f) => ({ ...f, destaque: !f.destaque }))}>
          <View style={[styles.checkbox, form.destaque && styles.checkboxActive]} />
          <Text style={styles.checkboxLabel}>Marcar como destaque</Text>
        </TouchableOpacity>
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titulo: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  resumo: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  chipText: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  textarea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border },
  checkboxActive: { backgroundColor: colors.azulDeep, borderColor: colors.azulDeep },
  checkboxLabel: { fontSize: 13, color: colors.textSecondary },
});
