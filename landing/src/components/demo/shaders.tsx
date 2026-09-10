"use client";

/**
 * The client boundary for ThreeUI's components.
 *
 * They are authored for a Vite app and carry no "use client" directive, and editing the
 * registered files to add one would break their published hashes. Re-exporting them from a
 * client module gets the same result and leaves the source byte-identical to the bundle.
 */
export { PredictiveArcCanvas } from "@/shaders/predictive-arc/PredictiveArcCanvas";
export { BrandOrbs } from "@/shaders/brand-orbs/BrandOrbs";
export { TextPathStudies } from "@/shaders/text-path-studies/TextPathStudies";
