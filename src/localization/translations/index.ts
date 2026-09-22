import en from './en.json';
import da from './da.json';
import de from './de.json';
import es from './es.json';
import fr from './fr.json';
import id from './id.json';
import it from './it.json';
import ja from './ja.json';
import ko from './ko.json';
import nb from './nb.json';
import pl from './pl.json';
import pt from './pt.json';
import ru from './ru.json';
import sv from './sv.json';
import th from './th.json';
import tr from './tr.json';
import vi from './vi.json';
import zhTW from './zh-TW.json';
import zhHant from './zh-Hant.json';
import hi from './hi.json';

export const resources = {
  en: { translation: en },
  da: { translation: da },
  de: { translation: de },
  es: { translation: es },
  fr: { translation: fr },
  hi: { translation: hi },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  nb: { translation: nb },
  pl: { translation: pl },
  pt: { translation: pt },
  ru: { translation: ru },
  sv: { translation: sv },
  th: { translation: th },
  tr: { translation: tr },
  vi: { translation: vi },
  zhTW: { translation: zhTW },
  zhHant: { translation: zhHant },
};

export type LanguageCode = keyof typeof resources;