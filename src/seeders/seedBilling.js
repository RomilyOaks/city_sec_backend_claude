import models from "../models/index.js";

const { Plan, Suscripcion, DatosFacturacion } = models;

const planesData = [
  {
    nombre: "Básico",
    descripcion: "Plan de entrada para municipalidades pequeñas",
    precio_base_mensual: 500.00,
    moneda: "PEN",
    max_usuarios: 10,
    max_novedades_mes: 500,
    precio_usuario_extra: 30.00,
    precio_novedad_extra_100: 15.00,
    activo: 1,
  },
  {
    nombre: "Estándar",
    descripcion: "Plan intermedio para operaciones medianas",
    precio_base_mensual: 1200.00,
    moneda: "PEN",
    max_usuarios: 30,
    max_novedades_mes: 2000,
    precio_usuario_extra: 25.00,
    precio_novedad_extra_100: 10.00,
    activo: 1,
  },
  {
    nombre: "Premium",
    descripcion: "Plan completo con usuarios y novedades ilimitadas",
    precio_base_mensual: 2500.00,
    moneda: "PEN",
    max_usuarios: null,        // ilimitado
    max_novedades_mes: null,   // ilimitado
    precio_usuario_extra: 20.00,
    precio_novedad_extra_100: 0.00,
    activo: 1,
  },
];

export async function seedBilling() {
  console.log("🔄 Iniciando seed de Billing...");

  // ─── 1. PLANES ────────────────────────────────────────────────
  console.log("\n📋 Creando planes...");
  let planesCreados = 0;
  let planesSinCambios = 0;

  for (const planData of planesData) {
    const [, wasCreated] = await Plan.findOrCreate({
      where: { nombre: planData.nombre },
      defaults: planData,
    });
    if (wasCreated) {
      planesCreados++;
      console.log(`  ✅ Creado: ${planData.nombre} (S/ ${planData.precio_base_mensual}/mes)`);
    } else {
      planesSinCambios++;
      console.log(`  ⏭️  Ya existe: ${planData.nombre}`);
    }
  }

  // ─── 2. SUSCRIPCIÓN ACTIVA ────────────────────────────────────
  console.log("\n📋 Verificando suscripción activa...");

  const suscripcionExistente = await Suscripcion.findOne({
    where: { estado: ["trial", "activa"] },
  });

  let suscripcionCreada = false;

  if (!suscripcionExistente) {
    const planInicialId = parseInt(process.env.PLAN_INICIAL, 10) || 3;
    const plan = await Plan.findByPk(planInicialId);

    if (!plan) {
      console.error(`  ❌ Plan con id=${planInicialId} no encontrado. Verifica PLAN_INICIAL.`);
    } else {
      // Fecha de hoy en Lima (UTC-5) — no usar toISOString() directamente sobre new Date()
      const now = new Date();
      const hoyPeru = new Date(now.getTime() - 5 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      await Suscripcion.create({
        plan_id: plan.id,
        estado: "activa",
        fecha_inicio: hoyPeru,
        fecha_fin: null,
        ciclo_facturacion: "mensual",
        dias_gracia: 15,
      });

      suscripcionCreada = true;
      console.log(`  ✅ Suscripción activa creada — Plan: ${plan.nombre}, inicio: ${hoyPeru}`);
    }
  } else {
    console.log(`  ⏭️  Ya existe suscripción con estado="${suscripcionExistente.estado}"`);
  }

  // ─── 3. DATOS DE FACTURACIÓN ──────────────────────────────────
  console.log("\n📋 Verificando datos de facturación...");

  const count = await DatosFacturacion.count();
  let datosCreados = false;

  if (count === 0) {
    await DatosFacturacion.create({
      razon_social: "Municipalidad Distrital de Chorrillos",
      ruc: "20131369669",
      direccion_fiscal: null,   // completar desde el panel
      ubigeo: "150108",
      email_facturacion: null,  // completar desde el panel
      representante_legal: null,
      cargo_representante: null,
    });
    datosCreados = true;
    console.log("  ✅ Registro de datos_facturacion creado (completar desde el panel)");
  } else {
    console.log("  ⏭️  Ya existe registro en datos_facturacion");
  }

  // ─── RESUMEN ──────────────────────────────────────────────────
  console.log("\n📊 Resumen Billing:");
  console.log(`   Planes      — creados: ${planesCreados}, sin cambios: ${planesSinCambios}`);
  console.log(`   Suscripción — ${suscripcionCreada ? "creada" : "ya existía"}`);
  console.log(`   Datos facturación — ${datosCreados ? "creado" : "ya existía"}`);

  return { planesCreados, planesSinCambios, suscripcionCreada, datosCreados };
}

export default seedBilling;
