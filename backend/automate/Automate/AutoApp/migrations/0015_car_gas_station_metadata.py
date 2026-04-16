from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("AutoApp", "0014_car_gas_station"),
    ]

    operations = [
        migrations.AddField(
            model_name="cargasstation",
            name="date",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="cargasstation",
            name="fuel_type",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="AutoApp.fueltype"),
        ),
        migrations.AddField(
            model_name="cargasstation",
            name="price_per_liter",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=7, null=True),
        ),
        migrations.AddField(
            model_name="cargasstation",
            name="supplier",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
