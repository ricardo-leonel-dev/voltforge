-- Elimina las filas de Terminal i/j del HTML template de DIgSILENT
UPDATE template_programs
SET html_template = REPLACE(
    REPLACE(
        html_template,
        '    <div class="row"><span class="lbl">Terminal i</span><span class="val w">{{terminal_i}}</span></div>',
        ''
    ),
    '    <div class="row"><span class="lbl">Terminal j</span><span class="val w">{{terminal_j}}</span></div>',
    ''
)
WHERE code = 'digsilent';
