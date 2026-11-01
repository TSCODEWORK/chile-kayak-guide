import { englishContent, ui as enUi } from './en.js';
import { content as esContent, ui as esUi } from './es.js';

const uiPacks = { en: enUi, es: esUi };
let english;

function contentPack(lang) {
  if (lang === 'es') return esContent;
  if (!english) english = englishContent();
  return english;
}

function read(obj, key) {
  return key.split('.').reduce((node, part) => (node == null ? node : node[part]), obj);
}

export function t(lang, key, vars) {
  let value = read(uiPacks[lang] || enUi, key);
  if (typeof value !== 'string') value = read(enUi, key);
  if (typeof value !== 'string') return key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function field(lang, group, id, name, index) {
  const node = contentPack(lang)?.[group]?.[id];
  const value = node?.[name];
  if (index == null) return typeof value === 'string' ? value : '';
  return Array.isArray(value) ? (value[index] ?? '') : '';
}
