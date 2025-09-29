#!/usr/bin/env python3
"""
Bridge System Content Parser

Parses the Uma + PS System PDF content and converts it to structured JSON format
for the interactive bridge reference system.
"""

import json
import re
from typing import Dict, List, Any, Optional

class BridgeContentParser:
    def __init__(self):
        self.data = {
            "metadata": {
                "title": "Uma + PS System",
                "version": "1.0",
                "lastUpdate": "Sep 2025",
                "author": "Rajesh Panchanathan"
            },
            "sections": {},
            "sequences": {},
            "definitions": {},
            "cross_references": {},
            "bid_colors": {
                "opener": {"background": "#d1fae5", "color": "#065f46", "border": "#a7f3d0"},
                "responder": {"background": "#dbeafe", "color": "#1e40af", "border": "#93c5fd"}
            },
            "link_types": {
                "red-text": {"color": "#dc2626", "target": "level2-content", "description": "Links to detailed sequences and rebids"},
                "green-text": {"color": "#059669", "target": "definitions-panel", "description": "Links to definitions and concepts"},
                "blue-text": {"color": "#2563eb", "target": "level2-content", "description": "Links to specific bid sequences"}
            }
        }

    def parse_pdf_content(self):
        """Parse the PDF content extracted from the document"""

        # 1 Club Opening content from PDF
        club_opening_content = """
        1 Club Opening: longer clubs or 44 in c and d; denies 5M unless strong hands with 6+c and 5M

        Non support showing responses
        1c1d: Walsh; 5+, 7+d any/ 4+d, no 4M; OR 5d4M, 4-5/15+ or 6d4M, 4-8/15+ ; Opener Rebids
        1c1M: 5+, 4+M, up the line; Opener rebids
        1c2h: Reverse Flannery: 5s4h/ 55/65, inv (Gd 8 – bad 11): (64 hands go via xyz); Opener Rebids
        1c2n: 10/11, no 4M generally denies 4d for 1d2n, nf; Opener Rebids
        1c3n: 12-14, no 4M

        Responses with support for m
        1c1n: 4+c, no 4 card M
        1c2s: 5sp, 4+m, inv; Opener rebids on 1c2s
        1c2c: Inverted minor: 10+, Opener rebids on 1c2c
        1c3c: pre-empt/mixed no stiff
        1c2d: Mixed with stiff; Opener Rebids
        1c3d/1c3M: Spl, 12-14 or 18+, denies 4OM
        """

        # Opener Rebids content from PDF
        opener_rebids_content = """
        Rebids by opener
        1. Opener rebids over 1c1d

        Rebids to show bal hands
        1c1d1n: 12-14; can have 4M if < 5c; rebids by responder on 1c1d1n
        1c1d2n (non vul): 18/19 bal responder rebids over 1c1d2n when non vul;

        Rebids to show single suiter clubs
        1c1d2c: 4+c, 12-14; responder rebids on 1c1d2c
        1c1d3c: 6+c, 15-17, nf
        1c1d2n (vul): long c, 18+, no sing, gf; responder rebids 1c1d2n when vul
        1c1d2h (non vul): Artificial reverse: c+h/ long c; f1; responder rebids on 1c1d2h (non vul)
        1c1d3n: Non vul: running c, 18-19, no sing; Vul: may be chancing (1c1d2n available)

        Rebids to show 2 suiter: c + another
        1c1d1M: 12-17, 5+c, 4M; rebids by responder on 1c1d1M
        1c1d2h (non vul): Artificial reverse: 5c,4h/ long c; gf (since jump shift)
        1c1d2h (vul): Natural reverse: 5c,4h; 18+, gf (since jump shift)
        1c1d2s: Natural reverse: 5c,4s 18+, gf (since jump shift)

        Rebids to show support for d
        1c1d2d: 4d, 4+c, 12-14
        1c1d3d: 4d, 4+c, 15-17
        1c1d3M: Spl for d, 18+; denies 4OM
        """

        # Definitions content from PDF
        definitions_content = """
        Walsh: Holding 5+d and 4M; bid 1d ( instead of 1M) when
        Weak hands (5-7) with 5/6 d and 4M; don't see game opp 18/19; so looking at signoff in d
        Strong hands, 15+ hcp; On such hands, subsequently 2d gf shows 45 and 2n st shows 46
        7+ d, any strength

        Artificial reverse (applicable only when non vul)
        1x1y2z (y ≠nt; z = cheapest 2 bid) = single suit x/ 45; f1; over this, general algorithm is as below
        2y if available = nf
        ask bid = 2fs or 2n whichever is cheaper; (non sign off hands)
        2y if available = 3 card y, 45 in y and x
        2n If available = 45, min
        3fs = single suit x, gf
        3y 3 card y, 45 in y and x ( if 2y is available then 3y = 6331)
        3x single suit x, min, nf ( if 2n is asking 3x = single x min or 45min)
        3z 45, max, gf
        3n single suit x, min, good suit, COG
        2n if not asking bid = nat, nf
        3x min, nf
        3y long y, nf if 2y not available, if 2y available then 3y = 0/1 loser suit
        3z 4 card z, gf

        Natural reverse: 1x1y2z: z is not the cheapest 2 bid, (not art reverse); f1, gf if jump shift
        General algo over this
        2y if available = 5+y, mostly gf
        2n or 2fs start of a possible weak sequence
        2n/3x relayed bid, min reverse
        rest max reverse
        3x gf
        3fs Can't raise p's suits, but good hand, slammish

        Reverse Flannery: Something
        Super splinter: something
        """

        self.parse_sections(club_opening_content)
        self.parse_sequences(opener_rebids_content)
        self.parse_definitions(definitions_content)

    def parse_sections(self, content: str):
        """Parse main section content"""

        # 1m opening section
        section = {
            "id": "1m-opening",
            "title": "1 Club Opening",
            "subtitle": "longer clubs or 44 in c and d; denies 5M unless strong hands with 6+c and 5M",
            "order": 1,
            "content": {
                "overview": "1 Club Opening: longer clubs or 44 in c and d; denies 5M unless strong hands with 6+c and 5M",
                "subsections": {
                    "non-support-responses": {
                        "title": "Non support showing responses",
                        "responses": [
                            {
                                "bid": "1c-1d",
                                "description": "Walsh: 5+, 7+d any/4+d, no 4M; OR 5d4M, 4-5/15+ or 6d4M, 4-8/15+",
                                "reference": "opener-rebids-1c1d",
                                "type": "red-link",
                                "definitions": ["walsh"]
                            },
                            {
                                "bid": "1c-1M",
                                "description": "5+, 4+M, up the line",
                                "reference": "opener-rebids-1cM",
                                "type": "red-link"
                            },
                            {
                                "bid": "1c-2h",
                                "description": "Reverse Flannery: 5s4h/55/65, inv (Gd 8 – bad 11): (64 hands go via xyz)",
                                "reference": "opener-rebids-1c2h",
                                "type": "red-link",
                                "definitions": ["reverse-flannery"]
                            },
                            {
                                "bid": "1c-2n",
                                "description": "10/11, no 4M generally denies 4d for 1d2n, nf",
                                "reference": "opener-rebids-1c2n",
                                "type": "red-link"
                            },
                            {
                                "bid": "1c-3n",
                                "description": "12-14, no 4M",
                                "reference": None,
                                "type": "terminal"
                            }
                        ]
                    },
                    "support-responses": {
                        "title": "Responses with support for m",
                        "responses": [
                            {
                                "bid": "1c-1n",
                                "description": "4+c, no 4 card M",
                                "reference": None,
                                "type": "terminal"
                            },
                            {
                                "bid": "1c-2s",
                                "description": "5sp, 4+m, inv",
                                "reference": "opener-rebids-1c2s",
                                "type": "red-link"
                            },
                            {
                                "bid": "1c-2c",
                                "description": "Inverted minor: 10+",
                                "reference": "opener-rebids-1c2c",
                                "type": "red-link"
                            },
                            {
                                "bid": "1c-3c",
                                "description": "pre-empt/mixed no stiff",
                                "reference": None,
                                "type": "terminal"
                            },
                            {
                                "bid": "1c-2d",
                                "description": "Mixed with stiff",
                                "reference": "opener-rebids-1c2d",
                                "type": "red-link"
                            },
                            {
                                "bid": "1c-3d/1c-3M",
                                "description": "Spl, 12-14 or 18+, denies 4OM",
                                "reference": None,
                                "type": "terminal"
                            }
                        ]
                    }
                }
            }
        }

        self.data["sections"]["1m-opening"] = section

        # Add placeholder sections for other main topics
        self.data["sections"]["1m-intervention"] = {
            "id": "1m-intervention",
            "title": "1m intervention",
            "subtitle": "Competitive bidding after 1m opening",
            "order": 2,
            "content": {"overview": "Responses when opponents intervene over 1m opening", "subsections": {}}
        }

        self.data["sections"]["1M-op"] = {
            "id": "1M-op",
            "title": "1M opening",
            "subtitle": "Major suit opening bids",
            "order": 3,
            "content": {"overview": "One-level major suit opening bids and responses", "subsections": {}}
        }

    def parse_sequences(self, content: str):
        """Parse detailed sequence content"""

        sequence = {
            "id": "opener-rebids-1c1d",
            "title": "Opener rebids over 1c-1d",
            "auction": ["1c", "1d"],
            "player": "opener",
            "categories": {
                "balanced": {
                    "title": "Rebids to show balanced hands",
                    "bids": [
                        {
                            "bid": "1c-1d-1n",
                            "description": "12-14; can have 4M if < 5c",
                            "reference": "responder-rebids-1c1d1n",
                            "hcp": "12-14",
                            "shape": "balanced",
                            "type": "opener-bid"
                        },
                        {
                            "bid": "1c-1d-2n",
                            "vulnerability": "non-vul",
                            "description": "18/19 bal",
                            "reference": "responder-rebids-1c1d2n-nv",
                            "hcp": "18-19",
                            "shape": "balanced",
                            "type": "opener-bid"
                        }
                    ]
                },
                "single-suiter-clubs": {
                    "title": "Rebids to show single suiter clubs",
                    "bids": [
                        {
                            "bid": "1c-1d-2c",
                            "description": "4+c, 12-14",
                            "reference": "responder-rebids-1c1d2c",
                            "hcp": "12-14",
                            "shape": "4+c",
                            "type": "opener-bid"
                        },
                        {
                            "bid": "1c-1d-3c",
                            "description": "6+c, 15-17, nf",
                            "reference": None,
                            "hcp": "15-17",
                            "shape": "6+c",
                            "type": "opener-bid"
                        },
                        {
                            "bid": "1c-1d-2n",
                            "vulnerability": "vul",
                            "description": "long c, 18+, no sing, gf",
                            "reference": "responder-rebids-1c1d2n-vul",
                            "hcp": "18+",
                            "shape": "long c",
                            "type": "opener-bid"
                        }
                    ]
                },
                "two-suiter": {
                    "title": "Rebids to show 2 suiter: c + another",
                    "bids": [
                        {
                            "bid": "1c-1d-1M",
                            "description": "12-17, 5+c, 4M",
                            "reference": "responder-rebids-1c1d1M",
                            "hcp": "12-17",
                            "shape": "5+c, 4M",
                            "type": "opener-bid"
                        },
                        {
                            "bid": "1c-1d-2h",
                            "vulnerability": "non-vul",
                            "description": "Artificial reverse: c+h/long c; f1",
                            "reference": "responder-rebids-1c1d2h-nv",
                            "hcp": "varies",
                            "shape": "c+h/long c",
                            "type": "opener-bid",
                            "definitions": ["artificial-reverse"]
                        },
                        {
                            "bid": "1c-1d-2h",
                            "vulnerability": "vul",
                            "description": "Natural reverse: 5c,4h; 18+, gf",
                            "reference": "responder-rebids-1c1d2h-vul",
                            "hcp": "18+",
                            "shape": "5c,4h",
                            "type": "opener-bid",
                            "definitions": ["natural-reverse"]
                        },
                        {
                            "bid": "1c-1d-2s",
                            "description": "Natural reverse: 5c,4s 18+, gf",
                            "reference": "responder-rebids-1c1d2s",
                            "hcp": "18+",
                            "shape": "5c,4s",
                            "type": "opener-bid",
                            "definitions": ["natural-reverse"]
                        }
                    ]
                },
                "diamond-support": {
                    "title": "Rebids to show support for d",
                    "bids": [
                        {
                            "bid": "1c-1d-2d",
                            "description": "4d, 4+c, 12-14",
                            "reference": None,
                            "hcp": "12-14",
                            "shape": "4d, 4+c",
                            "type": "opener-bid"
                        },
                        {
                            "bid": "1c-1d-3d",
                            "description": "4d, 4+c, 15-17",
                            "reference": None,
                            "hcp": "15-17",
                            "shape": "4d, 4+c",
                            "type": "opener-bid"
                        },
                        {
                            "bid": "1c-1d-3M",
                            "description": "Spl for d, 18+; denies 4OM",
                            "reference": None,
                            "hcp": "18+",
                            "shape": "splinter",
                            "type": "opener-bid"
                        }
                    ]
                }
            }
        }

        self.data["sequences"]["opener-rebids-1c1d"] = sequence

    def parse_definitions(self, content: str):
        """Parse definitions and concepts"""

        definitions = {
            "walsh": {
                "id": "walsh",
                "title": "Walsh Convention",
                "category": "bidding-convention",
                "definition": "Holding 5+d and 4M; bid 1d (instead of 1M) when:",
                "details": [
                    "Weak hands (5-7) with 5/6 d and 4M; don't see game opp 18/19; so looking at signoff in d",
                    "Strong hands, 15+ hcp; On such hands, subsequently 2d gf shows 45 and 2n st shows 46",
                    "7+ d, any strength"
                ],
                "examples": [
                    "♠ A432 ♥ 2 ♦ KJ987 ♣ 432 - Bid 1♦ (weak Walsh)",
                    "♠ AK32 ♥ 2 ♦ KQJ987 ♣ A32 - Bid 1♦ (strong Walsh)"
                ]
            },
            "artificial-reverse": {
                "id": "artificial-reverse",
                "title": "Artificial Reverse",
                "category": "bidding-convention",
                "vulnerability": "non-vul only",
                "definition": "1x-1y-2z (y ≠ NT; z = cheapest 2 bid) = single suit x/45; f1",
                "algorithm": {
                    "2y_if_available": "nf",
                    "ask_bid": "2fs or 2n whichever is cheaper (non sign off hands)",
                    "responses_to_ask": [
                        "2y if available = 3 card y, 45 in y and x",
                        "2n if available = 45, min",
                        "3fs = single suit x, gf",
                        "3y = 3 card y, 45 in y and x (if 2y available then 3y = 6331)",
                        "3x = single suit x, min, nf (if 2n asking: 3x = single x min or 45min)",
                        "3z = 45, max, gf",
                        "3n = single suit x, min, good suit, COG"
                    ],
                    "other_responses": [
                        "2n if not asking bid = nat, nf",
                        "3x = min, nf",
                        "3y = long y, nf if 2y not available, if 2y available then 3y = 0/1 loser suit",
                        "3z = 4 card z, gf"
                    ]
                }
            },
            "natural-reverse": {
                "id": "natural-reverse",
                "title": "Natural Reverse",
                "category": "bidding-convention",
                "definition": "1x-1y-2z: z is not the cheapest 2 bid (not artificial reverse); f1, gf if jump shift",
                "algorithm": {
                    "general_responses": [
                        "2y if available = 5+y, mostly gf",
                        "2n or 2fs = start of a possible weak sequence",
                        "2n/3x = relayed bid, min reverse",
                        "rest = max reverse",
                        "3x = gf",
                        "3fs = Can't raise p's suits, but good hand, slammish"
                    ]
                }
            },
            "reverse-flannery": {
                "id": "reverse-flannery",
                "title": "Reverse Flannery",
                "category": "bidding-convention",
                "definition": "2♥ response to 1♣ opening",
                "meaning": "5♠4♥/55/65, invitational (good 8 - bad 11)",
                "notes": "64 hands go via xyz convention"
            },
            "super-splinter": {
                "id": "super-splinter",
                "title": "Super Splinter",
                "category": "bidding-convention",
                "definition": "Advanced splinter bid showing exceptional slam interest",
                "details": "Placeholder - full definition to be added"
            }
        }

        self.data["definitions"].update(definitions)

        # Cross-references
        self.data["cross_references"] = {
            "1c-opening": ["walsh", "reverse-flannery", "artificial-reverse", "natural-reverse"],
            "opener-rebids": ["artificial-reverse", "natural-reverse", "super-splinter"],
            "walsh": ["1c-1d-response"],
            "artificial-reverse": ["opener-rebids-1c1d", "opener-rebids-1cM"],
            "natural-reverse": ["opener-rebids-1c1d", "opener-rebids-1cM"]
        }

    def convert_suits(self, text: str) -> str:
        """Convert suit letters to Unicode symbols"""
        replacements = {
            'c': '♣', 'C': '♣',
            'd': '♦', 'D': '♦',
            'h': '♥', 'H': '♥',
            's': '♠', 'S': '♠'
        }

        result = text
        for old, new in replacements.items():
            result = re.sub(rf'\b{old}\b', new, result)

        return result

    def save_data(self, filename: str = "bridge_system_data.json"):
        """Save the parsed data to JSON file"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)
        print(f"Data saved to {filename}")

    def generate_html_content(self) -> str:
        """Generate HTML content for display"""
        html_parts = []

        for section_id, section in self.data["sections"].items():
            html_parts.append(f'<h3>{section["title"]}</h3>')
            if section.get("subtitle"):
                html_parts.append(f'<p class="subtitle">{section["subtitle"]}</p>')

            content = section.get("content", {})
            if content.get("overview"):
                html_parts.append(f'<p>{content["overview"]}</p>')

            # Process subsections
            subsections = content.get("subsections", {})
            for subsection_id, subsection in subsections.items():
                html_parts.append(f'<h4>{subsection["title"]}</h4>')
                html_parts.append('<ul>')

                for response in subsection.get("responses", []):
                    bid = response["bid"]
                    desc = response["description"]

                    # Add appropriate link styling
                    if response.get("type") == "red-link":
                        desc = f'<span class="red-text">{desc}</span>'

                    # Add definition links
                    if response.get("definitions"):
                        for def_id in response["definitions"]:
                            def_name = def_id.replace("-", " ").title()
                            desc = desc.replace(def_name, f'<span class="green-text">{def_name}</span>')

                    html_parts.append(f'<li><strong>{bid}</strong>: {desc}</li>')

                html_parts.append('</ul>')

        return '\n'.join(html_parts)


def main():
    parser = BridgeContentParser()
    parser.parse_pdf_content()

    # Save the structured data
    parser.save_data("structured_bridge_data.json")

    # Generate HTML preview
    html_content = parser.generate_html_content()
    with open("content_preview.html", "w", encoding="utf-8") as f:
        f.write(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bridge Content Preview</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 2rem; }}
                .subtitle {{ color: #666; font-style: italic; }}
                .red-text {{ color: #dc2626; }}
                .green-text {{ color: #059669; }}
                .blue-text {{ color: #2563eb; }}
            </style>
        </head>
        <body>
            <h1>Uma + PS System Content Preview</h1>
            {html_content}
        </body>
        </html>
        """)

    print("Content parsing complete!")
    print("- Structured data: structured_bridge_data.json")
    print("- HTML preview: content_preview.html")


if __name__ == "__main__":
    main()