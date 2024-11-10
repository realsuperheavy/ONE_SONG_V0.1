declare module '../UI.js' {
    export interface DeprecatedUI<T> {
      [key: string]: T;
    }
  }
  
  declare module '../classes/DateLib.js' {
    export interface Locale {
      [key: string]: any;
    }
    
    export interface DateLib {
      [key: string]: any;
    }
  }
  
  declare module './shared.js' {
    export type ClassNames = {
      [key: string]: string;
    }
    
    export type ModifiersClassNames = {
      [key: string]: string;
    }
    
    export type Styles = {
      [key: string]: React.CSSProperties;
    }
    
    export type ModifiersStyles = {
      [key: string]: React.CSSProperties;
    }
    
    export type CustomComponents = {
      [key: string]: React.ComponentType<any>;
    }
    
    export type Matcher = Date | ((date: Date) => boolean);
    
    export type Labels = {
      [key: string]: string;
    }
    
    export type Formatters = {
      [key: string]: (date: Date) => string;
    }
    
    export type MonthChangeEventHandler = (month: Date) => void;
    
    export type DayEventHandler = (day: Date, modifiers: string[]) => void;
    
    export type Modifiers = {
      [key: string]: Matcher | Matcher[];
    }
    
    export type DateRange = {
      from: Date;
      to?: Date;
    }
    
    export type Mode = 'single' | 'multiple' | 'range';
  }