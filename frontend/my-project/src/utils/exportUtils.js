import { X } from "lucide-react";
import * as XLSX from "xlsx"
export const exportToExcel=(data,fileName="transaction")=>{
    if(!data || data.length === 0){
        alert("no daata to export")
        return;
    }
    try{
        const worksheet=XLSX.utils.json_to_sheet(data)
        const workbook=XLSX.utils.book_new();
        XLSX.writeFile(workbook,`${fileName}.xlsx`,{
        bookType:'xlsx',
        type:'array'
        })
    }
    catch(error){
        console.error("export error:",error);
        alert("Error exporting data.please try again.")
    }
}