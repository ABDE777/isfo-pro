import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import ofpptHeader from "@/assets/ofppt-header.png";

interface AttestationData {
  student: {
    first_name: string;
    last_name: string;
    birth_date: string;
    formation_level: string;
    speciality: string;
    formation_type: string;
    formation_mode: string;
    inscription_number: string;
    formation_year: string;
    student_group: string;
    email: string;
    gender?: string;
    reference_counter?: number;
  };
  request: {
    id: string;
    created_at: string;
    attestation_number?: number;
  };
}

interface AttestationGeneratorProps {
  attestationData: AttestationData;
  onPrint: () => void;
}

export const AttestationGenerator: React.FC<AttestationGeneratorProps> = ({
  attestationData,
  onPrint,
}) => {
  const { student, request } = attestationData;
  const currentDate = new Date().toLocaleDateString("fr-FR");
  const currentYear = new Date().getFullYear();
  // Use the attestation number from the request directly (already set by admin)
  const referenceNumber = request.attestation_number 
    ? String(request.attestation_number).padStart(3, "0")
    : "001";

  const formatBirthDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getYearLevel = (formationYear: string) => {
    if (
      formationYear.includes("1") ||
      formationYear.toLowerCase().includes("première") ||
      formationYear.toLowerCase().includes("first")
    ) {
      return "1ère année";
    } else if (
      formationYear.includes("2") ||
      formationYear.toLowerCase().includes("deuxième") ||
      formationYear.toLowerCase().includes("second")
    ) {
      return "2ème année";
    }
    return formationYear;
  };

  const mapSpeciality = (speciality: string) => {
    const specialityMap: Record<string, string> = {
      "development digital": "Developemtn digital",
      "infrastructure digital": "infrastructure digital",
      "web development": "developement option web full stack",
      "network systems": "infratrutcutre Réseaux et systèmes",
      "développement digital": "Developemtn digital",
      "infrastructure numérique": "infrastructure digital",
      "développement web": "developement option web full stack",
      "réseaux et systèmes": "infratrutcutre Réseaux et systèmes",
    };

    return specialityMap[speciality.toLowerCase()] || speciality;
  };

  const getDiplomaTerm = () => {
    return student.gender === "female" ? "Diplômante" : "Diplômant";
  };

  const getFormationYear = () => {
    return `${currentYear}/${currentYear + 1}`;
  };

  const handlePrint = () => {
    // Ensure the print styles are applied before printing
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const exportToWord = async () => {
    const { student, request } = attestationData;
    const currentDate = new Date().toLocaleDateString("fr-FR");
    const currentYear = new Date().getFullYear();

    // Convert image to data URL
    let imageDataUrl = ofpptHeader;

    try {
      // If it's a relative path, convert it to data URL
      if (ofpptHeader && !ofpptHeader.startsWith("data:")) {
        const response = await fetch(ofpptHeader);
        const blob = await response.blob();
        imageDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error("Error converting image to data URL:", error);
      // Fallback to original image URL
      imageDataUrl = ofpptHeader;
    }

    // Create Word document content
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Attestation de poursuite de formation</title>
      </head>
      <body>
        <div style="font-family: Times, serif; font-size: 14px; line-height: 1.6; color: #000;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${imageDataUrl}" alt="OFPPT Header" style="width: 100%; max-width: 500px;" />
          </div>

          <!-- Title -->
          <div style="text-align: center; margin-bottom: 24px; padding: 8px; border: 2px solid #333; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);">
            <h1 style="font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
              ATTESTATION DE POURSUITE DE FORMATION
            </h1>
          </div>

          <!-- Content -->
          <table style="width: 100%; border-collapse: collapse; max-width: 600px; margin: 0 auto; table-layout: fixed;">
            <tr>
              <td colspan="2" style="padding-bottom: 12px;">
                <span style="font-weight: bold;">Ref: DRCS/ISFO/GS/${referenceNumber}/${currentYear}</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 12px;">
                <span style="font-style: italic;">Je soussigné Directeur de l'établissement : </span>
                <span style="font-weight: bold;">INSTITUT SPECIALISE DE FORMATION DE L'OFFSHORING CASABLANCA</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 8px;">
                <span style="font-weight: bold;">Atteste que le stagiaire : </span>
                <span style="font-weight: bold; text-transform: uppercase;">${
                  student.last_name
                } ${student.first_name}</span>
              </td>
            </tr>

            <tr>
              <td style="width: 30%; vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Né le :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${formatBirthDate(student.birth_date)}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Niveau de formation :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>Technicien spécialisé</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Spécialité :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${mapSpeciality(student.speciality)}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">En:</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${getYearLevel(student.formation_year)}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Type Formation:</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>Résidentielle</span>
                <span style="margin-left: 40px; font-weight: bold;">Mode :</span>
                <span style="margin-left: 8px; font-weight: bold;">${getDiplomaTerm()}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">N° d'inscription :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${
                  student.inscription_number || student.email.split("@")[0]
                }</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 12px;">
                <span style="font-weight: bold;">Année de Formation:</span>
              </td>
              <td style="padding-bottom: 12px;">
                <span>${getFormationYear()}</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 16px;">
                <span style="font-weight: bold; font-style: italic;">- Poursuit sa formation à l'établissement</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 16px;">
                <span style="font-weight: bold; font-style: italic;">Cette attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.</span>
              </td>
            </tr>

            <tr>
              <td></td>
              <td style="text-align: right; padding-bottom: 8px;">
                <span style="font-weight: bold;">Fait à : </span>
                <span>Casablanca</span>
                <br />
                <span style="font-weight: bold;">Le: </span>
                <span>${currentDate}</span>
              </td>
            </tr>

            <tr>
              <td style="text-align: center; padding-top: 20px; padding-bottom: 10px; width: 50%;">
                <div style="font-weight: bold; text-decoration: underline;">Signature et Cachet du</div>
                <div style="font-weight: bold; text-decoration: underline;">Surveillant Général</div>
              </td>
              <td style="text-align: center; padding-top: 20px; padding-bottom: 10px; width: 50%;">
                <div style="font-weight: bold; text-decoration: underline;">Signature et cachet</div>
                <div style="font-weight: bold; text-decoration: underline;">du Directeur</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob(["\ufeff", content], {
      type: "application/msword",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attestation_${student.last_name}_${student.first_name}.doc`;
    link.click();
  };

  const exportToWordWithImage = async () => {
    const { student, request } = attestationData;
    const currentDate = new Date().toLocaleDateString("fr-FR");
    const currentYear = new Date().getFullYear();

    // Convert image to data URL
    const imageUrl = ofpptHeader;
    let imageDataUrl = imageUrl;

    try {
      // If it's a relative path, convert it to data URL
      if (imageUrl && !imageUrl.startsWith("data:")) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        imageDataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    } catch (error) {
      console.error("Error converting image to data URL:", error);
      // Fallback to original image URL
      imageDataUrl = imageUrl;
    }

    // Create Word document content with embedded image
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Attestation de poursuite de formation</title>
      </head>
      <body>
        <div style="font-family: Times, serif; font-size: 14px; line-height: 1.6; color: #000;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${imageDataUrl}" alt="OFPPT Header" style="width: 100%; max-width: 500px;" />
          </div>

          <!-- Title -->
          <div style="text-align: center; margin-bottom: 24px; padding: 8px; border: 2px solid #333; box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);">
            <h1 style="font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
              ATTESTATION DE POURSUITE DE FORMATION
            </h1>
          </div>

          <!-- Content -->
          <table style="width: 100%; border-collapse: collapse; max-width: 600px; margin: 0 auto; table-layout: fixed;">
            <tr>
              <td colspan="2" style="padding-bottom: 12px;">
                <span style="font-weight: bold;">Ref: DRCS/ISFO/GS/${referenceNumber}/${currentYear}</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 12px;">
                <span style="font-style: italic;">Je soussigné Directeur de l'établissement : </span>
                <span style="font-weight: bold;">INSTITUT SPECIALISE DE FORMATION DE L'OFFSHORING CASABLANCA</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 8px;">
                <span style="font-weight: bold;">Atteste que le stagiaire : </span>
                <span style="font-weight: bold; text-transform: uppercase;">${
                  student.last_name
                } ${student.first_name}</span>
              </td>
            </tr>

            <tr>
              <td style="width: 30%; vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Né le :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${formatBirthDate(student.birth_date)}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Niveau de formation :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>Technicien spécialisé</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Spécialité :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${mapSpeciality(student.speciality)}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">En:</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${getYearLevel(student.formation_year)}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">Type Formation:</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>Résidentielle</span>
                <span style="margin-left: 40px; font-weight: bold;">Mode :</span>
                <span style="margin-left: 8px; font-weight: bold;">${getDiplomaTerm()}</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 8px;">
                <span style="font-weight: bold;">N° d'inscription :</span>
              </td>
              <td style="padding-bottom: 8px;">
                <span>${
                  student.inscription_number || student.email.split("@")[0]
                }</span>
              </td>
            </tr>

            <tr>
              <td style="vertical-align: top; padding-bottom: 12px;">
                <span style="font-weight: bold;">Année de Formation:</span>
              </td>
              <td style="padding-bottom: 12px;">
                <span>${getFormationYear()}</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 16px;">
                <span style="font-weight: bold; font-style: italic;">- Poursuit sa formation à l'établissement</span>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding-bottom: 16px;">
                <span style="font-weight: bold; font-style: italic;">Cette attestation est délivrée à l'intéressé pour servir et valoir ce que de droit.</span>
              </td>
            </tr>

            <tr>
              <td></td>
              <td style="text-align: right; padding-bottom: 8px;">
                <span style="font-weight: bold;">Fait à : </span>
                <span>Casablanca</span>
                <br />
                <span style="font-weight: bold;">Le: </span>
                <span>${currentDate}</span>
              </td>
            </tr>

            <tr>
              <td style="text-align: center; padding-top: 20px; padding-bottom: 10px; width: 50%;">
                <div style="font-weight: bold; text-decoration: underline;">Signature et Cachet du</div>
                <div style="font-weight: bold; text-decoration: underline;">Surveillant Général</div>
              </td>
              <td style="text-align: center; padding-top: 20px; padding-bottom: 10px; width: 50%;">
                <div style="font-weight: bold; text-decoration: underline;">Signature et cachet</div>
                <div style="font-weight: bold; text-decoration: underline;">du Directeur</div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob(["\ufeff", content], {
      type: "application/msword",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `attestation_${student.last_name}_${student.first_name}.doc`;
    link.click();
  };

  return (
    <Card className="w-full max-w-4xl mx-auto print:p-0 print:shadow-none print:border-none">
      <CardHeader className="print:hidden">
        <CardTitle className="flex justify-between items-center">
          Aperçu de l'Attestation
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="print:hidden">
              Imprimer
            </Button>
            <Button
              onClick={() => exportToWord()}
              variant="outline"
              className="print:hidden"
            >
              Exporter Word
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="print:p-0">
        {/* Conteneur principal avec style d'impression */}
        <div
          className="bg-white p-8 print:p-6"
          style={{
            fontFamily: "Times, serif",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#000",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Header with OFPPT logo */}
          <div className="text-center mb-4">
            <img
              src={ofpptHeader}
              alt="OFPPT Header"
              className="w-full max-w-lg mx-auto print:max-w-md"
            />
          </div>

          {/* Titre de l'attestation avec cadre uniquement sur le titre */}
          <div
            className="text-center mb-6 py-2 border-2 border-gray-800 mx-auto"
            style={{
              maxWidth: "90%",
              boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h1
              className="text-2xl font-bold uppercase"
              style={{ letterSpacing: "1px", margin: 0 }}
            >
              ATTESTATION DE POURSUITE DE FORMATION
            </h1>
          </div>

          {/* Content using transparent table layout */}
          <table
            className="w-full mx-auto"
            style={{
              borderCollapse: "collapse",
              border: "none",
              maxWidth: "600px",
              tableLayout: "fixed",
            }}
          >
            <tbody>
              {/* Reference */}
              <tr>
                <td
                  colSpan={2}
                  className="pb-3 text-left"
                  style={{ paddingBottom: "12px" }}
                >
                  <span className="font-bold">
                    Ref: DRCS/ISFO/GS/{referenceNumber}/{currentYear}
                  </span>
                </td>
              </tr>

              {/* Director statement */}
              <tr>
                <td
                  colSpan={2}
                  className="pb-3 text-left"
                  style={{ paddingBottom: "12px" }}
                >
                  <span className="italic">
                    Je soussigné Directeur de l'établissement :{" "}
                  </span>
                  <span className="font-bold">
                    INSTITUT SPECIALISE DE FORMATION DE L'OFFSHORING CASABLANCA
                  </span>
                </td>
              </tr>

              {/* Student name */}
              <tr>
                <td
                  colSpan={2}
                  className="pb-2"
                  style={{ paddingBottom: "8px" }}
                >
                  <span className="font-bold">Atteste que le stagiaire : </span>
                  <span className="font-bold uppercase">
                    {student.last_name} {student.first_name}
                  </span>
                </td>
              </tr>

              {/* Birth date */}
              <tr>
                <td
                  style={{
                    width: "30%",
                    verticalAlign: "top",
                    paddingBottom: "8px",
                  }}
                >
                  <span className="font-bold">Né le :</span>
                </td>
                <td style={{ paddingBottom: "8px" }}>
                  <span>{formatBirthDate(student.birth_date)}</span>
                </td>
              </tr>

              {/* Formation level */}
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  <span className="font-bold">Niveau de formation :</span>
                </td>
                <td style={{ paddingBottom: "8px" }}>
                  <span>Technicien spécialisé</span>
                </td>
              </tr>

              {/* Speciality */}
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  <span className="font-bold">Spécialité :</span>
                </td>
                <td style={{ paddingBottom: "8px" }}>
                  <span>{mapSpeciality(student.speciality)}</span>
                </td>
              </tr>

              {/* Year level */}
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  <span className="font-bold">En:</span>
                </td>
                <td style={{ paddingBottom: "8px" }}>
                  <span>{getYearLevel(student.formation_year)}</span>
                </td>
              </tr>

              {/* Formation type and mode on same line */}
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  <span className="font-bold">Type Formation:</span>
                </td>
                <td style={{ paddingBottom: "8px" }}>
                  <span>Résidentielle</span>
                  <span className="ml-10 font-bold">Mode :</span>
                  <span className="ml-2 font-bold">{getDiplomaTerm()}</span>
                </td>
              </tr>

              {/* Registration number */}
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  <span className="font-bold">N° d'inscription :</span>
                </td>
                <td style={{ paddingBottom: "8px" }}>
                  <span>
                    {student.inscription_number || student.email.split("@")[0]}
                  </span>
                </td>
              </tr>

              {/* Formation year */}
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "12px" }}>
                  <span className="font-bold">Année de Formation:</span>
                </td>
                <td style={{ paddingBottom: "12px" }}>
                  <span>{getFormationYear()}</span>
                </td>
              </tr>

              {/* Training continuation */}
              <tr>
                <td colSpan={2} style={{ paddingBottom: "16px" }}>
                  <span className="font-bold italic">
                    - Poursuit sa formation à l'établissement
                  </span>
                </td>
              </tr>

              {/* Legal statement */}
              <tr>
                <td colSpan={2} style={{ paddingBottom: "16px" }}>
                  <span className="font-bold italic">
                    Cette attestation est délivrée à l'intéressé pour servir et
                    valoir ce que de droit.
                  </span>
                </td>
              </tr>

              {/* Date and place - ESPACEMENT RÉDUIT */}
              <tr>
                <td></td>
                <td style={{ textAlign: "right", paddingBottom: "8px" }}>
                  <span className="font-bold">Fait à : </span>
                  <span>Casablanca</span>
                  <br />
                  <span className="font-bold">Le: </span>
                  <span>{currentDate}</span>
                </td>
              </tr>

              {/* Signatures avec ESPACEMENT RÉDUIT */}
              <tr>
                <td
                  style={{
                    textAlign: "center",
                    paddingTop: "20px", // Réduit à seulement 20px
                    paddingBottom: "10px",
                    width: "50%",
                  }}
                >
                  <div className="font-bold underline">
                    Signature et Cachet du
                  </div>
                  <div className="font-bold underline">Surveillant Général</div>
                </td>
                <td
                  style={{
                    textAlign: "center",
                    paddingTop: "20px", // Réduit à seulement 20px
                    paddingBottom: "10px",
                    width: "50%",
                  }}
                >
                  <div className="font-bold underline">Signature et cachet</div>
                  <div className="font-bold underline">du Directeur</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
