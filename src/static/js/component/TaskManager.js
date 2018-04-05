/**
 *
 * @param aggregation
 */
function resetAggregation (aggregation) {
    var title = 'Deseja resetar o Lote: <b>' + aggregation.externalId + '</b> da Prova: <b>' + aggregation._template.externalId + '</b>?';
    var message = '<b>ATENÇÃO:</b> Este é um recurso que só deve ser utilizado em caso de urgência.<br /><br />';

    if (Number(aggregation.processStatus) === 1) {
        message += 'O lote terá seu status alterado de <b>IDENTIFICANDO</b> para <b>AGUARDANDO</b>.<br />';
        message += 'As provas do lote terão seu status alterado de <b>IDENTIFICANDO</b> para <b>AGUARDANDO</b>.<br />';
    } else {
        message += 'O lote terá seu status alterado de <b>CORRIGINDO</b> para <b>PENDENTE</b>.<br />';
        message += 'As provas do lote terão seu status alterado de <b>CORRIGINDO</b> para <b>PENDENTE</b>.<br />';
    }

    bootbox.dialog({
        title: title,
        message: message,
        buttons: {
            danger: {
                label: 'RESETAR',
                className: 'btn-danger',
                callback: function() {
                    $('#_id').val(aggregation._id);
                    $('#processStatus').val(aggregation.processStatus);
                    $('#frmTask').submit();
                }
            },
            main: {
                label: 'Cancelar',
                className: 'btn'
            }
        }
    });
}