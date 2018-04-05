USE [DATABASE_NAME]
GO

SET XACT_ABORT ON
BEGIN TRAN

DECLARE
	@ent_id UNIQUEIDENTIFIER
	, @sis_caminho VARCHAR(2000)
	, @sis_caminhoLogout VARCHAR(2000)
	, @sis_id INT
	, @gru_id_administrador UNIQUEIDENTIFIER
	, @usu_id UNIQUEIDENTIFIER

SET @sis_id = 217
SET @ent_id = (SELECT ent_id FROM SYS_Entidade WHERE ent_sigla = 'SMESP')
SET @sis_caminho = 'http://[APPLICATION_DOMAIN]/auth/signin'
SET @sis_caminhoLogout = 'http://[APPLICATION_DOMAIN]/auth/signout'

IF (NOT EXISTS(SELECT * FROM SYS_Sistema WHERE sis_id = @sis_id))
BEGIN
	INSERT INTO SYS_Sistema (sis_id, sis_nome, sis_descricao, sis_caminho, sis_tipoAutenticacao, sis_situacao, sis_caminhoLogout)
	VALUES (@sis_id, 'OMR Admin', '', @sis_caminho, 1, 1, @sis_caminhoLogout)
END

IF (NOT EXISTS(SELECT * FROM SYS_SistemaEntidade WHERE sis_id = @sis_id AND ent_id = @ent_id))
BEGIN
	INSERT INTO SYS_SistemaEntidade (sis_id, ent_id, sen_situacao) VALUES (@sis_id, @ent_id, 1)
END

IF (NOT EXISTS(SELECT * FROM SYS_Grupo WHERE sis_id = @sis_id AND gru_nome = 'Administrador'))
BEGIN
	INSERT INTO SYS_Grupo (gru_nome, gru_situacao, vis_id, sis_id, gru_integridade)
	VALUES ('Administrador', 1, 1, @sis_id, 1)
END

SET @gru_id_administrador = (SELECT gru_id FROM SYS_Grupo WHERE sis_id = @sis_id AND gru_nome = 'Administrador')
SET @usu_id = (SELECT usu_id FROM SYS_Usuario WHERE usu_login = 'admin' AND ent_id = @ent_id)

IF (NOT EXISTS(SELECT * FROM SYS_UsuarioGrupo WHERE gru_id = @gru_id_administrador AND usu_id = @usu_id))
BEGIN
	INSERT INTO SYS_UsuarioGrupo (usu_id, gru_id, usg_situacao)
	VALUES (@usu_id, @gru_id_administrador, 1)
END
GO

COMMIT TRAN