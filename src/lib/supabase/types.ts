
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "joyeria": {
          Tables: {
            "asignaciones": {
                  Row: {
                    "actualizado_en": string | null,"costo_pactado": number,"creado_en": string,"creado_por": number | null,"desviacion_dias": number | null,"dias_reales": number | null,"es_retrabajo": boolean,"estado": Database["joyeria"]['Enums']["estado_asignacion"],"excede_fecha_cliente": boolean,"fecha_asignacion": string,"fecha_compromiso": string,"fecha_inicio_real": string | null,"fecha_terminado_real": string | null,"id": number,"instrucciones": string | null,"joyero_id": number,"notas_joyero": string | null,"orden_id": number,"pagada": boolean
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"costo_pactado": number,"creado_en"?: string,"creado_por"?: number | null,"desviacion_dias"?: number | null,"dias_reales"?: number | null,"es_retrabajo"?: boolean,"estado"?: Database["joyeria"]['Enums']["estado_asignacion"],"excede_fecha_cliente"?: boolean,"fecha_asignacion"?: string,"fecha_compromiso": string,"fecha_inicio_real"?: string | null,"fecha_terminado_real"?: string | null,"id"?: never,"instrucciones"?: string | null,"joyero_id": number,"notas_joyero"?: string | null,"orden_id": number,"pagada"?: boolean
                  }
                  Update: {
                    "actualizado_en"?: string | null,"costo_pactado"?: number,"creado_en"?: string,"creado_por"?: number | null,"desviacion_dias"?: number | null,"dias_reales"?: number | null,"es_retrabajo"?: boolean,"estado"?: Database["joyeria"]['Enums']["estado_asignacion"],"excede_fecha_cliente"?: boolean,"fecha_asignacion"?: string,"fecha_compromiso"?: string,"fecha_inicio_real"?: string | null,"fecha_terminado_real"?: string | null,"id"?: never,"instrucciones"?: string | null,"joyero_id"?: number,"notas_joyero"?: string | null,"orden_id"?: number,"pagada"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "asignaciones_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                },"calendario_laboral": {
                  Row: {
                    "actualizado_en": string | null,"creado_en": string,"creado_por": number | null,"descripcion": string | null,"es_habil": boolean,"fecha": string,"id": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"es_habil": boolean,"fecha": string,"id"?: never
                  }
                  Update: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"es_habil"?: boolean,"fecha"?: string,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendario_laboral_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"clientes": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"correo": string | null,"creado_en": string,"creado_por": number | null,"direccion": string | null,"erp_cliente_id": number | null,"id": number,"nombre": string,"notas": string | null,"telefono": string | null
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"direccion"?: string | null,"erp_cliente_id"?: number | null,"id"?: never,"nombre": string,"notas"?: string | null,"telefono"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"direccion"?: string | null,"erp_cliente_id"?: number | null,"id"?: never,"nombre"?: string,"notas"?: string | null,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clientes_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"complejidades": {
                  Row: {
                    "actualizado_en": string | null,"creado_en": string,"descripcion": string | null,"id": number,"nombre": string,"orden": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"id"?: never,"nombre": string,"orden": number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"id"?: never,"nombre"?: string,"orden"?: number
                  }
                  Relationships: [
                    
                  ]
                },"control_calidad": {
                  Row: {
                    "asignacion_id": number | null,"creado_en": string,"id": number,"observaciones": string | null,"orden_id": number,"resultado": Database["joyeria"]['Enums']["resultado_calidad"],"revisado_por": number | null
                  }
                  Insert: {
                    "asignacion_id"?: number | null,"creado_en"?: string,"id"?: never,"observaciones"?: string | null,"orden_id": number,"resultado": Database["joyeria"]['Enums']["resultado_calidad"],"revisado_por"?: number | null
                  }
                  Update: {
                    "asignacion_id"?: number | null,"creado_en"?: string,"id"?: never,"observaciones"?: string | null,"orden_id"?: number,"resultado"?: Database["joyeria"]['Enums']["resultado_calidad"],"revisado_por"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "control_calidad_asignacion_id_fkey"
      columns: ["asignacion_id"]
isOneToOne: false
      referencedRelation: "asignaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "control_calidad_asignacion_id_fkey"
      columns: ["asignacion_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["asignacion_id"]
    },{
      foreignKeyName: "control_calidad_asignacion_id_fkey"
      columns: ["asignacion_id"]
isOneToOne: false
      referencedRelation: "vw_trabajos_joyero"
      referencedColumns: ["asignacion_id"]
    },{
      foreignKeyName: "control_calidad_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "control_calidad_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "control_calidad_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "control_calidad_revisado_por_fkey"
      columns: ["revisado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"correlativos": {
                  Row: {
                    "anio": number,"prefijo": string,"ultimo": number
                  }
                  Insert: {
                    "anio": number,"prefijo": string,"ultimo"?: number
                  }
                  Update: {
                    "anio"?: number,"prefijo"?: string,"ultimo"?: number
                  }
                  Relationships: [
                    
                  ]
                },"correos_salientes": {
                  Row: {
                    "asunto": string,"creado_en": string,"cuerpo_html": string,"enviado_en": string | null,"error": string | null,"estado": string,"id": number,"intentos": number,"para": string
                  }
                  Insert: {
                    "asunto": string,"creado_en"?: string,"cuerpo_html": string,"enviado_en"?: string | null,"error"?: string | null,"estado"?: string,"id"?: never,"intentos"?: number,"para": string
                  }
                  Update: {
                    "asunto"?: string,"creado_en"?: string,"cuerpo_html"?: string,"enviado_en"?: string | null,"error"?: string | null,"estado"?: string,"id"?: never,"intentos"?: number,"para"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cotizacion_detalle": {
                  Row: {
                    "cantidad": number,"complejidad_id": number,"costo_joyero": number,"cotizacion_id": number,"creado_en": string,"descripcion": string | null,"id": number,"orden": number,"precio_unitario": number,"tipo_trabajo_id": number
                  }
                  Insert: {
                    "cantidad"?: number,"complejidad_id": number,"costo_joyero"?: number,"cotizacion_id": number,"creado_en"?: string,"descripcion"?: string | null,"id"?: never,"orden"?: number,"precio_unitario"?: number,"tipo_trabajo_id": number
                  }
                  Update: {
                    "cantidad"?: number,"complejidad_id"?: number,"costo_joyero"?: number,"cotizacion_id"?: number,"creado_en"?: string,"descripcion"?: string | null,"id"?: never,"orden"?: number,"precio_unitario"?: number,"tipo_trabajo_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cotizacion_detalle_complejidad_id_fkey"
      columns: ["complejidad_id"]
isOneToOne: false
      referencedRelation: "complejidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizacion_detalle_cotizacion_id_fkey"
      columns: ["cotizacion_id"]
isOneToOne: false
      referencedRelation: "cotizaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizacion_detalle_tipo_trabajo_id_fkey"
      columns: ["tipo_trabajo_id"]
isOneToOne: false
      referencedRelation: "tipos_trabajo"
      referencedColumns: ["id"]
    }
                  ]
                },"cotizaciones": {
                  Row: {
                    "actualizado_en": string | null,"aprobada_en": string | null,"aprobada_por_nombre": string | null,"creado_en": string,"creado_por": number | null,"enviada_en": string | null,"estado": Database["joyeria"]['Enums']["estado_cotizacion"],"id": number,"margen_estimado": number | null,"motivo_rechazo": string | null,"notas": string | null,"orden_id": number,"total_cliente": number,"total_costo_joyero": number,"utilidad_estimada": number,"valido_hasta": string | null,"version": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"aprobada_en"?: string | null,"aprobada_por_nombre"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"enviada_en"?: string | null,"estado"?: Database["joyeria"]['Enums']["estado_cotizacion"],"id"?: never,"margen_estimado"?: number | null,"motivo_rechazo"?: string | null,"notas"?: string | null,"orden_id": number,"total_cliente"?: number,"total_costo_joyero"?: number,"utilidad_estimada"?: number,"valido_hasta"?: string | null,"version": number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"aprobada_en"?: string | null,"aprobada_por_nombre"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"enviada_en"?: string | null,"estado"?: Database["joyeria"]['Enums']["estado_cotizacion"],"id"?: never,"margen_estimado"?: number | null,"motivo_rechazo"?: string | null,"notas"?: string | null,"orden_id"?: number,"total_cliente"?: number,"total_costo_joyero"?: number,"utilidad_estimada"?: number,"valido_hasta"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "cotizaciones_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cotizaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                },"disenos": {
                  Row: {
                    "actualizado_en": string | null,"aprobado": boolean,"aprobado_en": string | null,"comentarios_cliente": string | null,"creado_en": string,"creado_por": number | null,"descripcion": string | null,"id": number,"nombre_archivo": string | null,"orden_id": number,"ruta_storage": string | null,"tipo_archivo": string | null,"version": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"aprobado"?: boolean,"aprobado_en"?: string | null,"comentarios_cliente"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"id"?: never,"nombre_archivo"?: string | null,"orden_id": number,"ruta_storage"?: string | null,"tipo_archivo"?: string | null,"version": number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"aprobado"?: boolean,"aprobado_en"?: string | null,"comentarios_cliente"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"id"?: never,"nombre_archivo"?: string | null,"orden_id"?: number,"ruta_storage"?: string | null,"tipo_archivo"?: string | null,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "disenos_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "disenos_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "disenos_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "disenos_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                },"especialidades": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"creado_en": string,"id": number,"nombre": string
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"creado_en"?: string,"id"?: never,"nombre": string
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"creado_en"?: string,"id"?: never,"nombre"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fotografias": {
                  Row: {
                    "creado_en": string,"descripcion": string | null,"id": number,"momento": Database["joyeria"]['Enums']["momento_foto"],"orden_id": number,"ruta_storage": string,"subido_por": number | null
                  }
                  Insert: {
                    "creado_en"?: string,"descripcion"?: string | null,"id"?: never,"momento": Database["joyeria"]['Enums']["momento_foto"],"orden_id": number,"ruta_storage": string,"subido_por"?: number | null
                  }
                  Update: {
                    "creado_en"?: string,"descripcion"?: string | null,"id"?: never,"momento"?: Database["joyeria"]['Enums']["momento_foto"],"orden_id"?: number,"ruta_storage"?: string,"subido_por"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fotografias_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fotografias_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fotografias_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fotografias_subido_por_fkey"
      columns: ["subido_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"joyeros": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"capacidad_maxima": number,"correo": string | null,"creado_en": string,"creado_por": number | null,"documento": string | null,"id": number,"nombre": string,"notas": string | null,"telefono": string | null,"usuario_id": number | null
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"capacidad_maxima"?: number,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"documento"?: string | null,"id"?: never,"nombre": string,"notas"?: string | null,"telefono"?: string | null,"usuario_id"?: number | null
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"capacidad_maxima"?: number,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"documento"?: string | null,"id"?: never,"nombre"?: string,"notas"?: string | null,"telefono"?: string | null,"usuario_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "joyeros_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "joyeros_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: true
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"joyeros_especialidades": {
                  Row: {
                    "especialidad_id": number,"joyero_id": number
                  }
                  Insert: {
                    "especialidad_id": number,"joyero_id": number
                  }
                  Update: {
                    "especialidad_id"?: number,"joyero_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "joyeros_especialidades_especialidad_id_fkey"
      columns: ["especialidad_id"]
isOneToOne: false
      referencedRelation: "especialidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "joyeros_especialidades_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    }
                  ]
                },"liquidacion_detalle": {
                  Row: {
                    "asignacion_id": number,"concepto": string | null,"creado_en": string,"es_descuento": boolean,"id": number,"liquidacion_id": number,"monto": number
                  }
                  Insert: {
                    "asignacion_id": number,"concepto"?: string | null,"creado_en"?: string,"es_descuento"?: boolean,"id"?: never,"liquidacion_id": number,"monto": number
                  }
                  Update: {
                    "asignacion_id"?: number,"concepto"?: string | null,"creado_en"?: string,"es_descuento"?: boolean,"id"?: never,"liquidacion_id"?: number,"monto"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "liquidacion_detalle_asignacion_id_fkey"
      columns: ["asignacion_id"]
isOneToOne: false
      referencedRelation: "asignaciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "liquidacion_detalle_asignacion_id_fkey"
      columns: ["asignacion_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["asignacion_id"]
    },{
      foreignKeyName: "liquidacion_detalle_asignacion_id_fkey"
      columns: ["asignacion_id"]
isOneToOne: false
      referencedRelation: "vw_trabajos_joyero"
      referencedColumns: ["asignacion_id"]
    },{
      foreignKeyName: "liquidacion_detalle_liquidacion_id_fkey"
      columns: ["liquidacion_id"]
isOneToOne: false
      referencedRelation: "liquidaciones_joyero"
      referencedColumns: ["id"]
    }
                  ]
                },"liquidaciones_joyero": {
                  Row: {
                    "actualizado_en": string | null,"creado_en": string,"creado_por": number | null,"estado": string,"fecha_pago": string | null,"forma_pago": Database["joyeria"]['Enums']["forma_pago"] | null,"id": number,"joyero_id": number,"notas": string | null,"pagada_por": number | null,"periodo_desde": string,"periodo_hasta": string,"referencia": string | null,"total": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"estado"?: string,"fecha_pago"?: string | null,"forma_pago"?: Database["joyeria"]['Enums']["forma_pago"] | null,"id"?: never,"joyero_id": number,"notas"?: string | null,"pagada_por"?: number | null,"periodo_desde": string,"periodo_hasta": string,"referencia"?: string | null,"total"?: number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"estado"?: string,"fecha_pago"?: string | null,"forma_pago"?: Database["joyeria"]['Enums']["forma_pago"] | null,"id"?: never,"joyero_id"?: number,"notas"?: string | null,"pagada_por"?: number | null,"periodo_desde"?: string,"periodo_hasta"?: string,"referencia"?: string | null,"total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "liquidaciones_joyero_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "liquidaciones_joyero_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "liquidaciones_joyero_pagada_por_fkey"
      columns: ["pagada_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"notificaciones": {
                  Row: {
                    "creado_en": string,"cuerpo": string | null,"enlace": string | null,"id": number,"leida_en": string | null,"tipo": string,"titulo": string,"usuario_id": number
                  }
                  Insert: {
                    "creado_en"?: string,"cuerpo"?: string | null,"enlace"?: string | null,"id"?: never,"leida_en"?: string | null,"tipo": string,"titulo": string,"usuario_id": number
                  }
                  Update: {
                    "creado_en"?: string,"cuerpo"?: string | null,"enlace"?: string | null,"id"?: never,"leida_en"?: string | null,"tipo"?: string,"titulo"?: string,"usuario_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "notificaciones_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"orden_detalle": {
                  Row: {
                    "cantidad": number,"complejidad_id": number,"costo_joyero_estimado": number,"creado_en": string,"descripcion": string | null,"dias_estimados": number,"id": number,"orden": number,"orden_id": number,"precio_cliente": number,"tipo_trabajo_id": number
                  }
                  Insert: {
                    "cantidad"?: number,"complejidad_id": number,"costo_joyero_estimado"?: number,"creado_en"?: string,"descripcion"?: string | null,"dias_estimados": number,"id"?: never,"orden"?: number,"orden_id": number,"precio_cliente"?: number,"tipo_trabajo_id": number
                  }
                  Update: {
                    "cantidad"?: number,"complejidad_id"?: number,"costo_joyero_estimado"?: number,"creado_en"?: string,"descripcion"?: string | null,"dias_estimados"?: number,"id"?: never,"orden"?: number,"orden_id"?: number,"precio_cliente"?: number,"tipo_trabajo_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "orden_detalle_complejidad_id_fkey"
      columns: ["complejidad_id"]
isOneToOne: false
      referencedRelation: "complejidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_detalle_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_detalle_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_detalle_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_detalle_tipo_trabajo_id_fkey"
      columns: ["tipo_trabajo_id"]
isOneToOne: false
      referencedRelation: "tipos_trabajo"
      referencedColumns: ["id"]
    }
                  ]
                },"orden_estados_historial": {
                  Row: {
                    "comentario": string | null,"creado_en": string,"estado_anterior": Database["joyeria"]['Enums']["estado_orden"] | null,"estado_nuevo": Database["joyeria"]['Enums']["estado_orden"],"id": number,"orden_id": number,"usuario_id": number | null
                  }
                  Insert: {
                    "comentario"?: string | null,"creado_en"?: string,"estado_anterior"?: Database["joyeria"]['Enums']["estado_orden"] | null,"estado_nuevo": Database["joyeria"]['Enums']["estado_orden"],"id"?: never,"orden_id": number,"usuario_id"?: number | null
                  }
                  Update: {
                    "comentario"?: string | null,"creado_en"?: string,"estado_anterior"?: Database["joyeria"]['Enums']["estado_orden"] | null,"estado_nuevo"?: Database["joyeria"]['Enums']["estado_orden"],"id"?: never,"orden_id"?: number,"usuario_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "orden_estados_historial_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_estados_historial_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_estados_historial_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orden_estados_historial_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"ordenes": {
                  Row: {
                    "actualizado_en": string | null,"cliente_id": number,"cobra_garantia": boolean,"creado_en": string,"creado_por": number | null,"descripcion_pieza": string,"dias_estimados": number | null,"entregada_con_saldo": boolean,"es_garantia": boolean,"estado": Database["joyeria"]['Enums']["estado_orden"],"fecha_entrega_real": string | null,"fecha_estimada_entrega": string | null,"fecha_prometida_cliente": string | null,"fecha_prometida_manual": boolean,"fecha_recepcion": string,"id": number,"joyero_responsable_garantia_id": number | null,"material": string | null,"motivo_anulacion": string | null,"numero": string,"observaciones_recepcion": string | null,"orden_origen_id": number | null,"peso_entrada_g": number | null,"peso_salida_g": number | null,"piedras": string | null,"precio_cliente": number,"quilataje": string | null,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"cliente_id": number,"cobra_garantia"?: boolean,"creado_en"?: string,"creado_por"?: number | null,"descripcion_pieza": string,"dias_estimados"?: number | null,"entregada_con_saldo"?: boolean,"es_garantia"?: boolean,"estado"?: Database["joyeria"]['Enums']["estado_orden"],"fecha_entrega_real"?: string | null,"fecha_estimada_entrega"?: string | null,"fecha_prometida_cliente"?: string | null,"fecha_prometida_manual"?: boolean,"fecha_recepcion"?: string,"id"?: never,"joyero_responsable_garantia_id"?: number | null,"material"?: string | null,"motivo_anulacion"?: string | null,"numero": string,"observaciones_recepcion"?: string | null,"orden_origen_id"?: number | null,"peso_entrada_g"?: number | null,"peso_salida_g"?: number | null,"piedras"?: string | null,"precio_cliente"?: number,"quilataje"?: string | null,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
                  }
                  Update: {
                    "actualizado_en"?: string | null,"cliente_id"?: number,"cobra_garantia"?: boolean,"creado_en"?: string,"creado_por"?: number | null,"descripcion_pieza"?: string,"dias_estimados"?: number | null,"entregada_con_saldo"?: boolean,"es_garantia"?: boolean,"estado"?: Database["joyeria"]['Enums']["estado_orden"],"fecha_entrega_real"?: string | null,"fecha_estimada_entrega"?: string | null,"fecha_prometida_cliente"?: string | null,"fecha_prometida_manual"?: boolean,"fecha_recepcion"?: string,"id"?: never,"joyero_responsable_garantia_id"?: number | null,"material"?: string | null,"motivo_anulacion"?: string | null,"numero"?: string,"observaciones_recepcion"?: string | null,"orden_origen_id"?: number | null,"peso_entrada_g"?: number | null,"peso_salida_g"?: number | null,"piedras"?: string | null,"precio_cliente"?: number,"quilataje"?: string | null,"tipo"?: Database["joyeria"]['Enums']["categoria_trabajo"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "vw_cliente_360"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_joyero_responsable_garantia_id_fkey"
      columns: ["joyero_responsable_garantia_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                },"pagos_cliente": {
                  Row: {
                    "creado_en": string,"fecha": string,"forma_pago": Database["joyeria"]['Enums']["forma_pago"],"id": number,"monto": number,"orden_id": number,"referencia": string | null,"registrado_por": number | null,"tipo": Database["joyeria"]['Enums']["tipo_pago"]
                  }
                  Insert: {
                    "creado_en"?: string,"fecha"?: string,"forma_pago": Database["joyeria"]['Enums']["forma_pago"],"id"?: never,"monto": number,"orden_id": number,"referencia"?: string | null,"registrado_por"?: number | null,"tipo": Database["joyeria"]['Enums']["tipo_pago"]
                  }
                  Update: {
                    "creado_en"?: string,"fecha"?: string,"forma_pago"?: Database["joyeria"]['Enums']["forma_pago"],"id"?: never,"monto"?: number,"orden_id"?: number,"referencia"?: string | null,"registrado_por"?: number | null,"tipo"?: Database["joyeria"]['Enums']["tipo_pago"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagos_cliente_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_cliente_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_cliente_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_cliente_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"parametros": {
                  Row: {
                    "actualizado_en": string | null,"clave": string,"descripcion": string | null,"grupo": string,"id": number,"tipo_dato": string,"valor": string
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"clave": string,"descripcion"?: string | null,"grupo"?: string,"id"?: never,"tipo_dato": string,"valor": string
                  }
                  Update: {
                    "actualizado_en"?: string | null,"clave"?: string,"descripcion"?: string | null,"grupo"?: string,"id"?: never,"tipo_dato"?: string,"valor"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sesiones": {
                  Row: {
                    "creado_en": string,"expira_en": string,"id": number,"token_hash": string,"ultima_actividad": string,"user_agent": string | null,"usuario_id": number
                  }
                  Insert: {
                    "creado_en"?: string,"expira_en": string,"id"?: never,"token_hash": string,"ultima_actividad"?: string,"user_agent"?: string | null,"usuario_id": number
                  }
                  Update: {
                    "creado_en"?: string,"expira_en"?: string,"id"?: never,"token_hash"?: string,"ultima_actividad"?: string,"user_agent"?: string | null,"usuario_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sesiones_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"tarifas_joyero": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"complejidad_id": number | null,"costo_acordado": number,"creado_en": string,"creado_por": number | null,"id": number,"joyero_id": number,"tipo_trabajo_id": number,"vigente_desde": string
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"complejidad_id"?: number | null,"costo_acordado": number,"creado_en"?: string,"creado_por"?: number | null,"id"?: never,"joyero_id": number,"tipo_trabajo_id": number,"vigente_desde"?: string
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"complejidad_id"?: number | null,"costo_acordado"?: number,"creado_en"?: string,"creado_por"?: number | null,"id"?: never,"joyero_id"?: number,"tipo_trabajo_id"?: number,"vigente_desde"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tarifas_joyero_complejidad_id_fkey"
      columns: ["complejidad_id"]
isOneToOne: false
      referencedRelation: "complejidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_joyero_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_joyero_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_joyero_tipo_trabajo_id_fkey"
      columns: ["tipo_trabajo_id"]
isOneToOne: false
      referencedRelation: "tipos_trabajo"
      referencedColumns: ["id"]
    }
                  ]
                },"tiempos_estandar": {
                  Row: {
                    "actualizado_en": string | null,"complejidad_id": number,"creado_en": string,"dias_habiles": number,"id": number,"tipo_trabajo_id": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"complejidad_id": number,"creado_en"?: string,"dias_habiles": number,"id"?: never,"tipo_trabajo_id": number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"complejidad_id"?: number,"creado_en"?: string,"dias_habiles"?: number,"id"?: never,"tipo_trabajo_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tiempos_estandar_complejidad_id_fkey"
      columns: ["complejidad_id"]
isOneToOne: false
      referencedRelation: "complejidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tiempos_estandar_tipo_trabajo_id_fkey"
      columns: ["tipo_trabajo_id"]
isOneToOne: false
      referencedRelation: "tipos_trabajo"
      referencedColumns: ["id"]
    }
                  ]
                },"tipos_trabajo": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"categoria": Database["joyeria"]['Enums']["categoria_trabajo"],"creado_en": string,"creado_por": number | null,"descripcion": string | null,"especialidad_id": number | null,"id": number,"nombre": string
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"categoria": Database["joyeria"]['Enums']["categoria_trabajo"],"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"especialidad_id"?: number | null,"id"?: never,"nombre": string
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"categoria"?: Database["joyeria"]['Enums']["categoria_trabajo"],"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"especialidad_id"?: number | null,"id"?: never,"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tipos_trabajo_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tipos_trabajo_especialidad_id_fkey"
      columns: ["especialidad_id"]
isOneToOne: false
      referencedRelation: "especialidades"
      referencedColumns: ["id"]
    }
                  ]
                },"transiciones_estado": {
                  Row: {
                    "desde": Database["joyeria"]['Enums']["estado_orden"],"disparador": string | null,"hacia": Database["joyeria"]['Enums']["estado_orden"]
                  }
                  Insert: {
                    "desde": Database["joyeria"]['Enums']["estado_orden"],"disparador"?: string | null,"hacia": Database["joyeria"]['Enums']["estado_orden"]
                  }
                  Update: {
                    "desde"?: Database["joyeria"]['Enums']["estado_orden"],"disparador"?: string | null,"hacia"?: Database["joyeria"]['Enums']["estado_orden"]
                  }
                  Relationships: [
                    
                  ]
                },"usuarios": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"contrasena_hash": string,"correo": string,"creado_en": string,"id": number,"nombre": string,"rol": Database["joyeria"]['Enums']["rol_usuario"],"telefono": string | null,"ultimo_acceso": string | null
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"contrasena_hash": string,"correo": string,"creado_en"?: string,"id"?: never,"nombre": string,"rol"?: Database["joyeria"]['Enums']["rol_usuario"],"telefono"?: string | null,"ultimo_acceso"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"contrasena_hash"?: string,"correo"?: string,"creado_en"?: string,"id"?: never,"nombre"?: string,"rol"?: Database["joyeria"]['Enums']["rol_usuario"],"telefono"?: string | null,"ultimo_acceso"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "vw_cliente_360": {
                  Row: {
                    "activo": boolean | null,"correo": string | null,"dias_desde_ultimo_servicio": number | null,"es_recurrente": boolean | null,"fecha_primer_servicio": string | null,"fecha_ultimo_servicio": string | null,"frecuencia_promedio_dias": number | null,"garantias": number | null,"id": number | null,"inactivo": boolean | null,"nombre": string | null,"ordenes_activas": number | null,"precio_maximo": number | null,"precio_minimo": number | null,"telefono": string | null,"ticket_promedio": number | null,"tipo_trabajo_mas_frecuente": string | null,"total_facturado": number | null,"total_ordenes": number | null,"utilidad_generada": number | null,"utilidad_promedio": number | null
                  }
                  Relationships: [
                    
                  ]
                },"vw_ordenes_economia": {
                  Row: {
                    "cliente": string | null,"cliente_id": number | null,"cobrado": number | null,"costo": number | null,"entregada_a_tiempo": boolean | null,"es_garantia": boolean | null,"estado": Database["joyeria"]['Enums']["estado_orden"] | null,"fecha_entrega_real": string | null,"fecha_prometida_cliente": string | null,"fecha_recepcion": string | null,"id": number | null,"joyero": string | null,"joyero_id": number | null,"margen": number | null,"numero": string | null,"orden_origen_id": number | null,"precio_cliente": number | null,"saldo": number | null,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"] | null,"utilidad": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "asignaciones_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "vw_cliente_360"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                },"vw_ordenes_tablero": {
                  Row: {
                    "actualizado_en": string | null,"asignacion_estado": Database["joyeria"]['Enums']["estado_asignacion"] | null,"asignacion_id": number | null,"cliente": string | null,"cliente_id": number | null,"cliente_telefono": string | null,"cobrado": number | null,"cotizacion_estado": Database["joyeria"]['Enums']["estado_cotizacion"] | null,"cotizacion_valido_hasta": string | null,"cotizacion_version": number | null,"creado_en": string | null,"creado_por": number | null,"descripcion_pieza": string | null,"dias_estimados": number | null,"es_garantia": boolean | null,"es_retrabajo": boolean | null,"estado": Database["joyeria"]['Enums']["estado_orden"] | null,"fecha_compromiso_joyero": string | null,"fecha_control": string | null,"fecha_entrega_real": string | null,"fecha_estimada_entrega": string | null,"fecha_prometida_cliente": string | null,"fecha_prometida_manual": boolean | null,"fecha_recepcion": string | null,"fotografias": number | null,"id": number | null,"joyero": string | null,"joyero_id": number | null,"lineas": number | null,"material": string | null,"numero": string | null,"orden_origen_id": number | null,"precio_cliente": number | null,"saldo": number | null,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"] | null,"trabajos": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "asignaciones_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "vw_cliente_360"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ordenes_orden_origen_id_fkey"
      columns: ["orden_origen_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                },"vw_trabajos_joyero": {
                  Row: {
                    "asignacion_id": number | null,"creado_en": string | null,"descripcion_pieza": string | null,"dias_estimados": number | null,"es_retrabajo": boolean | null,"estado_asignacion": Database["joyeria"]['Enums']["estado_asignacion"] | null,"estado_orden": Database["joyeria"]['Enums']["estado_orden"] | null,"fecha_asignacion": string | null,"fecha_compromiso": string | null,"fecha_inicio_real": string | null,"fecha_terminado_real": string | null,"fotos_entrada": number | null,"instrucciones": string | null,"joyero_id": number | null,"material": string | null,"notas_joyero": string | null,"numero": string | null,"orden_id": number | null,"piedras": string | null,"quilataje": string | null,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"] | null,"trabajos": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "asignaciones_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "ordenes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_economia"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "asignaciones_orden_id_fkey"
      columns: ["orden_id"]
isOneToOne: false
      referencedRelation: "vw_ordenes_tablero"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "fn_anotar_orden":
{ Args: { "p_comentario": string,"p_orden_id": number,"p_usuario_id": number }; Returns: undefined
                           },
"fn_anular_asignacion":
{ Args: { "p_asignacion_id": number,"p_motivo": string,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_anular_liquidacion":
{ Args: { "p_liquidacion_id": number }; Returns: undefined
                           },
"fn_aprobar_cotizacion":
{ Args: { "p_aprobada_por_nombre": string,"p_cotizacion_id": number,"p_dias_estimados": number,"p_fecha_estimada": string,"p_fecha_prometida": string,"p_lineas": Json,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_asignar_joyero":
{ Args: { "p_comentario"?: string,"p_costo": number,"p_excede": boolean,"p_fecha_compromiso": string,"p_instrucciones": string,"p_joyero_id": number,"p_orden_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"costo_pactado": number,
"creado_en": string,
"creado_por": number | null,
"desviacion_dias": number | null,
"dias_reales": number | null,
"es_retrabajo": boolean,
"estado": Database["joyeria"]['Enums']["estado_asignacion"],
"excede_fecha_cliente": boolean,
"fecha_asignacion": string,
"fecha_compromiso": string,
"fecha_inicio_real": string | null,
"fecha_terminado_real": string | null,
"id": number,
"instrucciones": string | null,
"joyero_id": number,
"notas_joyero": string | null,
"orden_id": number,
"pagada": boolean
            }
                          SetofOptions: {
        from: "*"
        to: "asignaciones"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_cambiar_estado_orden":
{ Args: { "p_comentario"?: string,"p_estado_nuevo": Database["joyeria"]['Enums']["estado_orden"],"p_orden_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_carga_joyeros":
{ Args: Record<PropertyKey, never>; Returns: {
              "a_tiempo": number,"activas": number,"joyero_id": number,"retrabajos": number,"terminadas": number
            }[]
                           },
"fn_confirmar_liquidacion":
{ Args: { "p_fecha_pago": string,"p_forma_pago": Database["joyeria"]['Enums']["forma_pago"],"p_liquidacion_id": number,"p_referencia": string,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"creado_en": string,
"creado_por": number | null,
"estado": string,
"fecha_pago": string | null,
"forma_pago": Database["joyeria"]['Enums']["forma_pago"] | null,
"id": number,
"joyero_id": number,
"notas": string | null,
"pagada_por": number | null,
"periodo_desde": string,
"periodo_hasta": string,
"referencia": string | null,
"total": number
            }
                          SetofOptions: {
        from: "*"
        to: "liquidaciones_joyero"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_crear_garantia":
{ Args: { "p_cobra": boolean,"p_descripcion_pieza": string,"p_dias_estimados": number,"p_fecha_estimada": string,"p_fecha_prometida": string,"p_joyero_responsable_id": number,"p_lineas": Json,"p_observaciones": string,"p_orden_origen_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_crear_orden":
{ Args: { "p_cliente_id": number,"p_dias_estimados": number,"p_fecha_estimada": string,"p_fecha_prometida": string,"p_fecha_prometida_manual": boolean,"p_lineas": Json,"p_pieza": Json,"p_tipo": Database["joyeria"]['Enums']["categoria_trabajo"],"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_desempeno_joyeros":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "activo": boolean,"asignados": number,"atrasados": number,"costo_total": number,"cumplimiento_pct": number,"dias_promedio_respuesta": number,"en_proceso": number,"joyero": string,"joyero_id": number,"pendiente_pago": number,"retrabajo_pct": number,"terminados": number
            }[]
                           },
"fn_economia_por_joyero":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "costo": number,"ingreso": number,"joyero": string,"joyero_id": number,"margen": number,"ordenes": number,"utilidad": number
            }[]
                           },
"fn_economia_por_tipo":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "categoria": Database["joyeria"]['Enums']["categoria_trabajo"],"costo_estimado": number,"ingreso": number,"lineas": number,"margen": number,"tipo_trabajo": string,"tipo_trabajo_id": number,"utilidad": number
            }[]
                           },
"fn_economia_resumen":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "cobrado_en_periodo": number,"costo": number,"costo_garantias": number,"garantias": number,"ingreso": number,"margen": number,"ordenes": number,"pendiente_pago_joyeros": number,"saldo_pendiente_total": number,"utilidad": number
            }[]
                           },
"fn_entregar_orden":
{ Args: { "p_comentario"?: string,"p_con_saldo": boolean,"p_orden_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_enviar_cotizacion":
{ Args: { "p_cotizacion_id": number,"p_usuario_id": number,"p_valido_hasta": string }; Returns: {
              "actualizado_en": string | null,
"aprobada_en": string | null,
"aprobada_por_nombre": string | null,
"creado_en": string,
"creado_por": number | null,
"enviada_en": string | null,
"estado": Database["joyeria"]['Enums']["estado_cotizacion"],
"id": number,
"margen_estimado": number | null,
"motivo_rechazo": string | null,
"notas": string | null,
"orden_id": number,
"total_cliente": number,
"total_costo_joyero": number,
"utilidad_estimada": number,
"valido_hasta": string | null,
"version": number
            }
                          SetofOptions: {
        from: "*"
        to: "cotizaciones"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_generar_liquidacion":
{ Args: { "p_desde": string,"p_hasta": string,"p_joyero_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"creado_en": string,
"creado_por": number | null,
"estado": string,
"fecha_pago": string | null,
"forma_pago": Database["joyeria"]['Enums']["forma_pago"] | null,
"id": number,
"joyero_id": number,
"notas": string | null,
"pagada_por": number | null,
"periodo_desde": string,
"periodo_hasta": string,
"referencia": string | null,
"total": number
            }
                          SetofOptions: {
        from: "*"
        to: "liquidaciones_joyero"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_guardar_cotizacion":
{ Args: { "p_cotizacion_id": number,"p_lineas": Json,"p_notas"?: string }; Returns: {
              "actualizado_en": string | null,
"aprobada_en": string | null,
"aprobada_por_nombre": string | null,
"creado_en": string,
"creado_por": number | null,
"enviada_en": string | null,
"estado": Database["joyeria"]['Enums']["estado_cotizacion"],
"id": number,
"margen_estimado": number | null,
"motivo_rechazo": string | null,
"notas": string | null,
"orden_id": number,
"total_cliente": number,
"total_costo_joyero": number,
"utilidad_estimada": number,
"valido_hasta": string | null,
"version": number
            }
                          SetofOptions: {
        from: "*"
        to: "cotizaciones"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_indicadores_operacion":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "activas": number,"conversion_pct": number,"cotizaciones_aprobadas": number,"cotizaciones_enviadas": number,"desviacion_promedio": number,"dias_promedio_total": number,"entregadas": number,"entregadas_a_tiempo": number,"pct_a_tiempo": number,"recibidas": number
            }[]
                           },
"fn_ingresos_nuevos_vs_recurrentes":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "clientes": number,"ingreso": number,"ordenes": number,"segmento": string,"utilidad": number
            }[]
                           },
"fn_iniciar_trabajo":
{ Args: { "p_asignacion_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"costo_pactado": number,
"creado_en": string,
"creado_por": number | null,
"desviacion_dias": number | null,
"dias_reales": number | null,
"es_retrabajo": boolean,
"estado": Database["joyeria"]['Enums']["estado_asignacion"],
"excede_fecha_cliente": boolean,
"fecha_asignacion": string,
"fecha_compromiso": string,
"fecha_inicio_real": string | null,
"fecha_terminado_real": string | null,
"id": number,
"instrucciones": string | null,
"joyero_id": number,
"notas_joyero": string | null,
"orden_id": number,
"pagada": boolean
            }
                          SetofOptions: {
        from: "*"
        to: "asignaciones"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_nueva_version_cotizacion":
{ Args: { "p_orden_id": number,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"aprobada_en": string | null,
"aprobada_por_nombre": string | null,
"creado_en": string,
"creado_por": number | null,
"enviada_en": string | null,
"estado": Database["joyeria"]['Enums']["estado_cotizacion"],
"id": number,
"margen_estimado": number | null,
"motivo_rechazo": string | null,
"notas": string | null,
"orden_id": number,
"total_cliente": number,
"total_costo_joyero": number,
"utilidad_estimada": number,
"valido_hasta": string | null,
"version": number
            }
                          SetofOptions: {
        from: "*"
        to: "cotizaciones"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_purgar_sesiones":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"fn_ranking_clientes":
{ Args: { "p_criterio"?: string,"p_desde": string,"p_hasta": string,"p_limite"?: number }; Returns: {
              "cliente": string,"cliente_id": number,"facturado": number,"ordenes": number,"utilidad": number
            }[]
                           },
"fn_recalcular_cotizacion":
{ Args: { "p_cotizacion_id": number }; Returns: undefined
                           },
"fn_rechazar_cotizacion":
{ Args: { "p_cotizacion_id": number,"p_motivo": string,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_registrar_calidad":
{ Args: { "p_fecha_compromiso_retrabajo"?: string,"p_observaciones": string,"p_orden_id": number,"p_resultado": Database["joyeria"]['Enums']["resultado_calidad"],"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"cliente_id": number,
"cobra_garantia": boolean,
"creado_en": string,
"creado_por": number | null,
"descripcion_pieza": string,
"dias_estimados": number | null,
"entregada_con_saldo": boolean,
"es_garantia": boolean,
"estado": Database["joyeria"]['Enums']["estado_orden"],
"fecha_entrega_real": string | null,
"fecha_estimada_entrega": string | null,
"fecha_prometida_cliente": string | null,
"fecha_prometida_manual": boolean,
"fecha_recepcion": string,
"id": number,
"joyero_responsable_garantia_id": number | null,
"material": string | null,
"motivo_anulacion": string | null,
"numero": string,
"observaciones_recepcion": string | null,
"orden_origen_id": number | null,
"peso_entrada_g": number | null,
"peso_salida_g": number | null,
"piedras": string | null,
"precio_cliente": number,
"quilataje": string | null,
"tipo": Database["joyeria"]['Enums']["categoria_trabajo"]
            }
                          SetofOptions: {
        from: "*"
        to: "ordenes"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_siguiente_numero":
{ Args: { "p_prefijo": string }; Returns: string
                           },
"fn_tasa_recompra":
{ Args: Record<PropertyKey, never>; Returns: {
              "clientes_con_servicio": number,"clientes_recurrentes": number,"tasa_recompra_pct": number
            }[]
                           },
"fn_terminar_trabajo":
{ Args: { "p_asignacion_id": number,"p_desviacion_dias": number,"p_dias_reales": number,"p_notas": string,"p_usuario_id": number }; Returns: {
              "actualizado_en": string | null,
"costo_pactado": number,
"creado_en": string,
"creado_por": number | null,
"desviacion_dias": number | null,
"dias_reales": number | null,
"es_retrabajo": boolean,
"estado": Database["joyeria"]['Enums']["estado_asignacion"],
"excede_fecha_cliente": boolean,
"fecha_asignacion": string,
"fecha_compromiso": string,
"fecha_inicio_real": string | null,
"fecha_terminado_real": string | null,
"id": number,
"instrucciones": string | null,
"joyero_id": number,
"notas_joyero": string | null,
"orden_id": number,
"pagada": boolean
            }
                          SetofOptions: {
        from: "*"
        to: "asignaciones"
        isOneToOne: true
        isSetofReturn: false
      } },
"fn_ticket_promedio":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "ordenes": number,"ticket_promedio": number,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"],"utilidad_promedio": number
            }[]
                           },
"fn_tiempo_por_tipo":
{ Args: { "p_desde": string,"p_hasta": string }; Returns: {
              "categoria": Database["joyeria"]['Enums']["categoria_trabajo"],"dias_promedio": number,"ordenes": number,"tipo_trabajo": string,"tipo_trabajo_id": number
            }[]
                           },
"fn_utilidad_mensual":
{ Args: { "p_meses"?: number }; Returns: {
              "costo": number,"entregadas": number,"ingreso": number,"mes": string,"utilidad": number
            }[]
                           },
"fn_vencer_cotizaciones":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            "categoria_trabajo": "reparacion"|"creacion","estado_asignacion": "asignada"|"en_proceso"|"terminada"|"rechazada_calidad"|"cerrada"|"anulada","estado_cotizacion": "borrador"|"enviada"|"aprobada"|"rechazada"|"vencida"|"reemplazada","estado_orden": "recibida"|"cotizada"|"aprobada"|"asignada"|"en_proceso"|"terminada_joyero"|"en_control_calidad"|"lista_entrega"|"entregada"|"rechazada"|"anulada","forma_pago": "efectivo"|"tarjeta"|"transferencia"|"otro","momento_foto": "entrada"|"proceso"|"salida"|"diseno","resultado_calidad": "aprobado"|"rechazado","rol_usuario": "admin"|"taller"|"joyero"|"gerencia","tipo_pago": "anticipo"|"saldo"|"total"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "joyeria": {
          Enums: {
            "categoria_trabajo": ["reparacion", "creacion"],"estado_asignacion": ["asignada", "en_proceso", "terminada", "rechazada_calidad", "cerrada", "anulada"],"estado_cotizacion": ["borrador", "enviada", "aprobada", "rechazada", "vencida", "reemplazada"],"estado_orden": ["recibida", "cotizada", "aprobada", "asignada", "en_proceso", "terminada_joyero", "en_control_calidad", "lista_entrega", "entregada", "rechazada", "anulada"],"forma_pago": ["efectivo", "tarjeta", "transferencia", "otro"],"momento_foto": ["entrada", "proceso", "salida", "diseno"],"resultado_calidad": ["aprobado", "rechazado"],"rol_usuario": ["admin", "taller", "joyero", "gerencia"],"tipo_pago": ["anticipo", "saldo", "total"]
          }
        }
} as const
