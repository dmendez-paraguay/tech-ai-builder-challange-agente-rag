ANSWERED_MARKER = "[ESTADO: RESPONDIDA]"
NOT_ANSWERED_MARKER = "[ESTADO: SIN_RESPUESTA]"


def parse_answer(raw_answer: str) -> tuple[str, bool]:
    answer_not_found = NOT_ANSWERED_MARKER in raw_answer
    answer = raw_answer.replace(ANSWERED_MARKER, "", 1).replace(
        NOT_ANSWERED_MARKER,
        "",
        1,
    ).strip()
    return answer, answer_not_found
