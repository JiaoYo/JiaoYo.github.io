export function export2Excel(columns,list,costomTime){
    require.ensure([], () => {
        const { export_json_to_excel } = require('./excel/Export2Excel');
        let tHeader = []
        let filterVal = []
        columns.forEach(item =>{
        	// 这里是定义Excel表格里面的表头和内容
            tHeader.push(item.title)
            // dataIndex是表格中的columns数据在list中对应的 key
            filterVal.push(item.dataIndex)
        })
        const data = list.map(v => filterVal.map(j => v[j]))
        // 三个参数，第一个是表头，第二个是单元格内容，第三个是Excel文件名称
        export_json_to_excel(tHeader, data, costomTime);
    })
}
