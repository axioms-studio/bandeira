package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

// Constraint holds the schema definition for the Constraint entity.
type Constraint struct {
	ent.Schema
}

func (Constraint) Fields() []ent.Field {
	return []ent.Field{
		field.String("context_name"),
		field.Enum("operator").Values(
			"IN", "NOT_IN",
			"STR_CONTAINS", "STR_STARTS_WITH", "STR_ENDS_WITH",
			"NUM_EQ", "NUM_GT", "NUM_GTE", "NUM_LT", "NUM_LTE",
			"DATE_AFTER", "DATE_BEFORE",
		),
		field.JSON("values", []string{}),
		field.Bool("inverted").Default(false),
		field.Bool("case_insensitive").Default(false),
		field.Int("strategy_id"),
		field.Time("created_at").Default(time.Now).Immutable(),
		field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
	}
}

func (Constraint) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("strategy", Strategy.Type).
			Ref("constraints").
			Field("strategy_id").
			Required().
			Unique(),
	}
}
