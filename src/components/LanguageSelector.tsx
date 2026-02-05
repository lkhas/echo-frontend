 import { Globe } from 'lucide-react';
 import { useTranslation } from 'react-i18next';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { languages } from '@/i18n';
 
 export const LanguageSelector = () => {
   const { i18n } = useTranslation();
 
   const handleLanguageChange = (value: string) => {
     i18n.changeLanguage(value);
   };
 
   const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
 
   return (
     <Select value={i18n.language} onValueChange={handleLanguageChange}>
       <SelectTrigger className="w-auto gap-2 h-9 px-3 bg-background/80 backdrop-blur-sm border-border/50">
         <Globe className="w-4 h-4 text-muted-foreground" />
         <SelectValue>
           {currentLanguage.nativeName}
         </SelectValue>
       </SelectTrigger>
       <SelectContent>
         {languages.map((lang) => (
           <SelectItem key={lang.code} value={lang.code}>
             <span className="flex items-center gap-2">
               <span>{lang.nativeName}</span>
               {lang.code !== 'en' && (
                 <span className="text-xs text-muted-foreground">({lang.name})</span>
               )}
             </span>
           </SelectItem>
         ))}
       </SelectContent>
     </Select>
   );
 };