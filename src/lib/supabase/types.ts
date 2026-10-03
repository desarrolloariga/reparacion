
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "joyeria": {
          Tables: {
            "calendario_laboral": {
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
      referencedRelation: "vw_ordenes_tablero"
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
            "vw_ordenes_tablero": {
                  Row: {
                    "actualizado_en": string | null,"cliente": string | null,"cliente_id": number | null,"cliente_telefono": string | null,"cotizacion_estado": Database["joyeria"]['Enums']["estado_cotizacion"] | null,"cotizacion_valido_hasta": string | null,"cotizacion_version": number | null,"creado_en": string | null,"creado_por": number | null,"descripcion_pieza": string | null,"dias_estimados": number | null,"es_garantia": boolean | null,"estado": Database["joyeria"]['Enums']["estado_orden"] | null,"fecha_compromiso_joyero": string | null,"fecha_control": string | null,"fecha_entrega_real": string | null,"fecha_estimada_entrega": string | null,"fecha_prometida_cliente": string | null,"fecha_prometida_manual": boolean | null,"fecha_recepcion": string | null,"fotografias": number | null,"id": number | null,"joyero": string | null,"joyero_id": number | null,"lineas": number | null,"material": string | null,"numero": string | null,"orden_origen_id": number | null,"precio_cliente": number | null,"tipo": Database["joyeria"]['Enums']["categoria_trabajo"] | null,"trabajos": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "ordenes_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
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
"fn_siguiente_numero":
{ Args: { "p_prefijo": string }; Returns: string
                           },
"fn_vencer_cotizaciones":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            "categoria_trabajo": "reparacion"|"creacion","estado_cotizacion": "borrador"|"enviada"|"aprobada"|"rechazada"|"vencida"|"reemplazada","estado_orden": "recibida"|"cotizada"|"aprobada"|"asignada"|"en_proceso"|"terminada_joyero"|"en_control_calidad"|"lista_entrega"|"entregada"|"rechazada"|"anulada","momento_foto": "entrada"|"proceso"|"salida"|"diseno","rol_usuario": "admin"|"taller"|"joyero"|"gerencia"
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
            "categoria_trabajo": ["reparacion", "creacion"],"estado_cotizacion": ["borrador", "enviada", "aprobada", "rechazada", "vencida", "reemplazada"],"estado_orden": ["recibida", "cotizada", "aprobada", "asignada", "en_proceso", "terminada_joyero", "en_control_calidad", "lista_entrega", "entregada", "rechazada", "anulada"],"momento_foto": ["entrada", "proceso", "salida", "diseno"],"rol_usuario": ["admin", "taller", "joyero", "gerencia"]
          }
        }
} as const
