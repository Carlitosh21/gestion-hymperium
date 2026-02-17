-- Migración 018: Seed de preguntas de onboarding
-- Solo se ejecuta una vez gracias a _seed_ejecutado

CREATE TABLE IF NOT EXISTS _seed_ejecutado (
  nombre VARCHAR(255) PRIMARY KEY,
  ejecutado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _seed_ejecutado WHERE nombre = 'preguntas_onboarding') THEN
    INSERT INTO _seed_ejecutado (nombre) VALUES ('preguntas_onboarding');

    INSERT INTO preguntas_onboarding (titulo, descripcion, pregunta, tipo, opciones, orden, activa) VALUES
    ('Descripción Negocio', 'Describe tu negocio en 3 a 5 renglones. Ejemplo: Órdenes Construcciones es una empresa dedicada a la venta, distribución y construcción de viviendas pre-fabricadas ubicada en Santiago, Chile. Distribuimos y construimos viviendas en todo el país.', 'Descripción Negocio', 'texto', NULL, 1, true),
    ('País e idioma', '¿De qué país es el Agente? para saber su dialecto (Español de España, Argentino, etc.) y también que aclare si SOLO habla en ese idioma, o si alguien le habla en otro idioma debe contestar en ese idioma.', 'País e idioma', 'texto', NULL, 2, true),
    ('El agente tiene que decir que es una IA?', 'En los primeros mensajes del agente, en el saludo, se debe presentar como IA/asistente virtual o hacerse pasar completamente por una persona. Lo mismo cuando alguien le pregunte si es una IA', 'El agente tiene que decir que es una IA?', 'texto', NULL, 3, true),
    ('Nombre/rol al inicio', 'El agente debe mencionar su nombre/rol al Inicio o solo si se lo preguntan?', 'Nombre/rol al inicio', 'texto', NULL, 4, true),
    ('Datos imprescindibles vs opcionales', 'Qué datos tuyos (fundador/marca) son imprescindibles mencionar y cuáles son opcionales que el agente deba tener en conocimiento', 'Datos imprescindibles vs opcionales', 'texto', NULL, 5, true),
    ('Historia/Títulos (confianza)', 'Que elementos tuyos se deben usar para generar confianza? Casos De Éxito, Títulos Universitarios, etc.', 'Historia/Títulos (confianza)', 'texto', NULL, 6, true),
    ('Frases a evitar al presentarse', 'Hay alguna frase o palabra que quieres evitar que use el setter al presentarse', 'Frases a evitar al presentarse', 'texto', NULL, 7, true),
    ('Objetivo de la Conversación', 'Qué objetivo de negocio querés priorizar (venta directa, agendar llamada, conseguir email, otro), detallar lo mejor posible si es otro', 'Objetivo de la Conversación', 'texto', NULL, 8, true),
    ('Finaliza (derivación)', 'Cuando terminaría el flujo conversacional PRINCIPAL del agente (Si llega a este punto, la conversación se deriva): Link de Acceso a X lugar, Link de Agenda, Agenda Confirmada, Compra Confirmada, No se deriva a menos que cumpla con los Casos específicos de Derivación que dsps vas a preguntarle', 'Finaliza (derivación)', 'texto', NULL, 9, true),
    ('Éxito', '¿Qué resultado mínimo se considera "éxito" en una conversación? (por ejemplo: enviar link, agendar llamada, conseguir teléfono) (lo que debe buscar hacer el Agente)', 'Éxito', 'texto', NULL, 10, true),
    ('Oferta 1 línea', 'Detalla tu oferta en 1 sola oración', 'Oferta 1 línea', 'texto', NULL, 11, true),
    ('Mecanismo Único', '¿Cuál es tu mecanismo Único? ¿Cómo se llama? y qué Resultados Específicos PROMETES?', 'Mecanismo Único', 'texto', NULL, 12, true),
    ('Descripción Completa de Oferta', '¿Qué incluye exactamente la oferta? (módulos, sesiones, comunidad, recursos descargables, coaching 1:1, soporte, llamadas, etc.) NO DESCRIBAS PLANES DE PAGO, esa es otra pregunta. Sino que incluye', 'Descripción Completa de Oferta', 'texto', NULL, 13, true),
    ('Variaciones/Planes de la oferta', '¿Tiene variaciones/Planes tu oferta? Hay versiones distintas del mismo producto (entrada, estándar, premium): describe cada una y diferencias. Si el precio se le dice en la llamada, NO NOS DES EL PRECIO, solo contesta en todas las preguntas relacionadas al precio que se le dirá en la llamada el precio', 'Variaciones/Planes de la oferta', 'texto', NULL, 14, true),
    ('Contenido Específico a Resaltar', 'Hay contenidos específicos que deben resaltarse (plantillas, acceso a app, etc.)', 'Contenido Específico a Resaltar', 'texto', NULL, 15, true),
    ('Avatar y Anti-Avatar', '¿Cuál es el Avatar Idóneo al que va dirigida tu oferta? y ¿cuáles son las Personas a las que NO les vendes? el "Anti-Avatar"', 'Avatar y Anti-Avatar', 'texto', NULL, 16, true),
    ('Prueba Gratuita / Lead Magnet', '¿Existe o Existirá una prueba gratuita, muestra o lead magnet que el setter debe ofrecer?', 'Prueba Gratuita / Lead Magnet', 'texto', NULL, 17, true),
    ('Planes de Pago', '¿Cuál es el precio de cada modalidad? (mensual, anual, pago único, planes de pago) y ¿cómo quieres que se presente? Se presenta 1 y si pasa X se le ofrece otra o se le presentan ambas a la vez.', 'Planes de Pago', 'texto', NULL, 18, true),
    ('Garantía', '¿Ofreces garantía o política de devolución? en caso afirmativo, detallar exactamente', 'Garantía', 'texto', NULL, 19, true),
    ('Promociones temporales', '¿Quieres que el setter ofrezca descuentos, upsells o down-sells en chat; si sí, ¿cuáles y cuándo?', 'Promociones temporales', 'texto', NULL, 20, true),
    ('Acceso tras la compra', 'Cómo accede el cliente al producto tras la compra (link directo, plataforma X, email de bienvenida, acceso manual). Detallar proceso Post-Venta y de Onboarding', 'Acceso tras la compra', 'texto', NULL, 21, true),
    ('Datos previos al Link', 'El setter debe enviar el link (de compra, de agenda, etc.) directamente por chat o primero confirmar datos antes de enviarlo. De ser así, ¿qué datos debe confirmar?', 'Datos previos al Link', 'texto', NULL, 22, true),
    ('Verificación Post-Pago', 'Si se requiere verificación manual post-pago, quién lo hace y en cuánto tiempo. En caso de que no, detallar proceso de pago del cliente', 'Verificación Post-Pago', 'texto', NULL, 23, true),
    ('Frases que NO se Deben Usar', 'COSAS QUE NO DEBE DECIR. Cuáles son las frases que NO se deben usar para no crear expectativas irreales', 'Frases que NO se Deben Usar', 'texto', NULL, 24, true),
    ('Flujo Conversacional DM', 'Si la persona te envía un DM Directo, ¿qué hace el Setter? ¿Comienza a Cualificar o Entra en un Modo amigo y le va sacando dolores poco a poco?', 'Flujo Conversacional DM', 'texto', NULL, 25, true),
    ('Flujo Conversacional HISTORIA', 'Si la persona te responde una historia, ¿cómo reacciona el Setter? Modo amigo o cualifica', 'Flujo Conversacional HISTORIA', 'texto', NULL, 26, true),
    ('CTA: recurso directo o cualificar', 'Si la persona le envía un CTA, el Setter debe enviarle de primera el recurso o primero le hace un par de preguntas y si cualifica pasa con la oferta directo sin enviarle el recurso, y si no cualifica, le envía el Link', 'CTA: recurso directo o cualificar', 'texto', NULL, 27, true),
    ('Personas a derivar', '¿A qué personas el Setter debe derivar apenas lo detecte? Menores de Edad, Cuando le hacen una oferta porque le venden algunos servicios, cuando es de algún país específico, cuando Pide hablar con alguien del equipo, Cuando pide Algo relacionado a la atención al cliente (Reembolso, Problemas con la plataforma, etc.)', 'Personas a derivar', 'texto', NULL, 28, true),
    ('Mencionar derivación', '¿Se le debe mencionar que se lo está derivando? y de ser así, ¿se le debe mencionar a quien se lo deriva? ej: te voy a derivar con Juan, mi director Comercial. o solo tiene que decir que lo deriva con alguien especializado', 'Mencionar derivación', 'texto', NULL, 29, true),
    ('Trigger para salir de Modo Amigo', 'SI anteriormente se dijo que se ponía en ''Modo Amigo'', ¿qué trigger o frase haría que el Modo Amigo se Skipee y se salte directamente a hacerle la oferta?', 'Trigger para salir de Modo Amigo', 'texto', NULL, 30, true),
    ('3 formas de presentar la oferta', 'Dame 3 formas de presentar la oferta de venta, toma en cuenta la longitud del Mensaje', '3 formas de presentar la oferta', 'texto', NULL, 31, true),
    ('Elementos que SÍ debe enviar', '¿Qué elementos SI o SI debe enviar el Setter al presentar la oferta? (Precio, módulos, Beneficios, Garantía, etc.)', 'Elementos que SÍ debe enviar', 'texto', NULL, 32, true),
    ('Elementos que NO debe presentar directamente', '¿Qué elementos NO tiene que presentar directamente? a menos que pregunten', 'Elementos que NO debe presentar directamente', 'texto', NULL, 33, true),
    ('Objeciones comunes', 'Objeciones: ¿Qué objeciones son las más comunes en tu negocio y cómo las resuelves?', 'Objeciones comunes', 'texto', NULL, 34, true),
    ('Palabras a usar y evitar', '¿Qué palabras debe usar y cuáles no (además del dialecto)? ej: Querés que hable Argentino, pero que no diga cosas como ''che'', boludo, papa, etc.', 'Palabras a usar y evitar', 'texto', NULL, 35, true),
    ('Links Útiles', '¿Qué links debería de tener el Setter? Link de agenda, link a grupo de Whatsapp, link de venta, etc', 'Links Útiles', 'texto', NULL, 36, true),
    ('Ejemplos de Conversaciones', 'Envía Ejemplos de Conversaciones (link de Drive) que hayas tenido para ver cómo contestaría el setter y qué vocabulario usaría', 'Ejemplos de Conversaciones', 'texto', NULL, 37, true);

  END IF;
END $$;
