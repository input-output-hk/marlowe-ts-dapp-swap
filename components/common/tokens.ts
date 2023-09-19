
export type CurrencyF = String 
export type WholeNumberF = string
export type DecimalF = string  
export const formatADAs = (lovelaces:bigint,isMainnet:Boolean = false,currencyName : string = "₳"): [WholeNumberF,DecimalF,CurrencyF] => 
    {  
        const adas = (Math.trunc(Number(lovelaces).valueOf() / 1_000_000))
        const decimalADAs = (lovelaces % 1_000_000n)
        const currency = isMainnet ? currencyName : "t" + currencyName
        return [adas.toString(),decimalADAs.toString().padStart(6, '0'),currency]
    }