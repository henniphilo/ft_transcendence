# FMEA – Testen einer Web-Anwendung mit Google Chrome (Inkognito) und 127.0.0.1:8080

In diesem Beispiel wird eine FMEA (Failure Mode and Effects Analysis) für das Testen einer lokalen Web-Anwendung durchgeführt. Wichtige Punkte:

1. **Browser**: Google Chrome **ausschließlich im Inkognito-Modus**, damit kein unerwünschtes Caching stattfindet.  
2. **URL**: **127.0.0.1:8080** verwenden (nicht `localhost` oder `0.0.0.0`).  

Untenstehend eine **Mermaid Mindmap** (Achtung: Das **mindmap-Feature** benötigt eine aktuelle Mermaid-Version, sonst kann es zu Fehlermeldungen kommen):

```mermaid
mindmap
  root((FMEA: Web-Anwendungstest))

    Browserwahl((Schritt 1: Browserwahl))
      Inkognito("**Möglicher Fehler**: Kein Inkognito-Modus\n
      **Fehlerfolge**: Alte Cache-Daten, inkonsistente Testergebnisse\n
      **Fehlerursache**: Anwender vergisst, Inkognito zu aktivieren\n
      **Bewertung**: S=6, O=3, D=2 ⇒ RPN=36\n
      **Maßnahme**: Klare Anweisung & Erinnerung an Inkognito-Benutzung")

    URL_Nutzung((Schritt 2: URL-Nutzung))
      FalscheURL("**Möglicher Fehler**: Falsche URL (z.B. localhost)\n
      **Fehlerfolge**: Anwendung nicht erreichbar oder falsche Umgebung\n
      **Fehlerursache**: Gewohnheit, falsche Doku\n
      **Bewertung**: S=5, O=4, D=3 ⇒ RPN=60\n
      **Maßnahme**: Eindeutige Dokumentation & Hinweis auf richtige URL")

    Ports((Schritt 3: Ports & Firewall))
      Port8080("**Möglicher Fehler**: Port 8080 gesperrt oder belegt\n
      **Fehlerfolge**: Keine Verbindung, Test schlägt fehl\n
      **Fehlerursache**: Firewall-Regeln, andere Anwendungen nutzen Port\n
      **Bewertung**: S=7, O=2, D=4 ⇒ RPN=56\n
      **Maßnahme**: Port-Freigabe prüfen, laufende Prozesse kontrollieren")
