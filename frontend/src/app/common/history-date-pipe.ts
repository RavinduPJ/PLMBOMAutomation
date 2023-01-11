import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name:'histDate'
})

export class HistoryDatePipe implements PipeTransform {
    transform(value: Date) : string {
        if(value === undefined){
            return '--Select--'
        }
        const date: Date = new Date(value)
        return `${date.toDateString()} at ${date.toLocaleTimeString()}`
    }

}