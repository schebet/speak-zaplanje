import { useDialect } from "@/contexts/DialectContext";

export function Footer() {
  const { t } = useDialect();

  return (
    <footer className="bg-primary text-primary-foreground mt-12">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-serif font-bold text-lg mb-3">{t("О нама")}</h4>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">
              {t("Заплање — локални портал посвећен вестима, култури, традицији и животу у заплањском крају. Повезујемо заједницу и чувамо наслеђе.")}
            </p>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg mb-3">{t("Категорије")}</h4>
            <ul className="space-y-1 text-sm text-primary-foreground/70">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">{t("Вести")}</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">{t("Култура")}</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">{t("Традиција")}</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">{t("Догађаји")}</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">{t("Природа")}</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">{t("Спорт")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-bold text-lg mb-3">{t("Контакт")}</h4>
            <ul className="space-y-1 text-sm text-primary-foreground/70">
              <li>📧 redakcija@zaplanje.rs</li>
              <li>📞 +381 18 123 456</li>
              <li>📍 Гаџин Хан, Србија</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-xs text-primary-foreground/50">
          © 2026 Заплање — {t("Локални портал")}. {t("Сва права задржана")}.
        </div>
      </div>
    </footer>
  );
}
